import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

class AuthRepository {
    async findUserByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        phone_no: true,
        name: true,
        role: true,
        status: true,
        registered_date: true,
        password_hash: true,
        last_login: true,
        profile_picture_url: true,
        bio: true,
      },
    });
  }

  async createUser(userData) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const status = userData.role === 'traveler' ? 'active' : 'pending';
    
    const baseUserData = {
      name: userData.name,
      email: userData.email,
      phone_no: userData.phone_no,
      role: userData.role,
      status: status,
      password_hash: hashedPassword,
      profile_picture_url: userData.profile_picture_url || '',
      bio: userData.bio || '',
    };

    return prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: baseUserData,
        select: {
          id: true,
          email: true,
          phone_no: true,
          name: true,
          role: true,
          status: true,
          profile_picture_url: true,
          bio: true,
        },
      });

      switch (userData.role) {
        case "travel_guide":
          await prisma.travelGuide.create({
            data: {
              user_id: user.id,
              years_of_experience: userData.years_of_experience || 0,
              verification_documents:userData. verification_documents,
              languages_spoken: userData.languages_spoken || ["English"],
            },
          });
          break;

        case "vendor":
          const location = await prisma.location.create({
            data: {
              address: userData.address,
              city: userData.city || 'Unknown',
              province: userData.province || 'Unknown',
              latitude: userData.latitude || 0,
              longitude: userData.longitude || 0,
            },
          });

          await prisma.POI.create({
            data: {
              name: userData.business_name || userData.name,
              category: "restaurant",
              type: userData.business_type || userData.restaurantType,
              location_id: location.id,
              vendor_id: user.id,
            },
          });
          break;

        case "traveler":
          await prisma.traveler.create({
            data: {
              user_id: user.id,
            },
          });
          break;

        default:
          throw new Error("Invalid user role");
      }
      return user;
    });
  }
}

export { AuthRepository };