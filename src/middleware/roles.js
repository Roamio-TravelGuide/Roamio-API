import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Optional authentication - doesn't throw error if no token
export const optionalAuth = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        travelers: true,
        guides: true,
        vendor_profile: true,
      },
    });

    req.user = user
      ? {
          id: user.id,
          role: user.role,
          email: user.email,
          name: user.name,
          travel_guide: user.guides,
          vendor_profile: user.vendor_profile,
          traveler: user.travelers,
        }
      : null;
  } catch (err) {
    req.user = null;
  }

  next();
};

// Simple role-based access control middleware
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(", ")}`,
      });
    }
    next();
  };
};

// Admin/Moderator only access
export const requireAdmin = requireRole("admin", "moderator");
