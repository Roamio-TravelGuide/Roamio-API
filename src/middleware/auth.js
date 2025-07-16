import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Handle both userId and id in token payload
    const userId = decoded.userId || decoded.id;

    // Fetch complete user data from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        travelers: true,
        guides: true,
        vendor_profile: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Add user to request object with all needed data
    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      travel_guide: user.guides,
      vendor_profile: user.vendor_profile,
      traveler: user.travelers,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid token",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
};

export default authenticate;
