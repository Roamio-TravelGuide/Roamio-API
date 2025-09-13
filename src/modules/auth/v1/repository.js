import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

class AuthRepository {
  async findUserByEmail(email) {
    return prisma.user.findUnique({ 
      where: { email, status: 'active' },
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
              verification_documents: userData.verification_documents,
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

  // Save password reset OTP and expiry
  async savePasswordResetOTP(userId, otp, expiry) {
    console.log(`Saving OTP to DB - User: ${userId}, OTP: ${otp}, Expiry: ${expiry}`);
    
    return prisma.user.update({
      where: { id: userId },
      data: {
        resetOTP: otp,
        resetOTPExpiry: expiry,
      },
    });
  }

  // Find user by reset OTP - FIXED VERSION
  // Update the findUserByResetOTP method
async findUserByResetOTP(otp) {
  const currentTime = new Date();
  console.log(`Looking for OTP: ${otp}`);
  console.log(`Current server time: ${currentTime}`);
  console.log(`Current UTC time: ${currentTime.toUTCString()}`);
  
  // Use UTC time for consistent comparison
  const utcCurrentTime = new Date(currentTime.toISOString());
  
  const result = await prisma.user.findFirst({
    where: {
      resetOTP: otp,
      resetOTPExpiry: {
        gte: utcCurrentTime, // Use UTC time for consistent comparison
      },
    },
    select: {
      id: true,
      email: true,
      resetOTP: true,
      resetOTPExpiry: true,
    },
  });
  
  console.log('Database query result:', result);
  
  if (result && result.resetOTPExpiry) {
    const expiryDate = new Date(result.resetOTPExpiry);
    const timeDiff = expiryDate - utcCurrentTime;
    console.log(`OTP expiry: ${expiryDate}`);
    console.log(`Server time: ${utcCurrentTime}`);
    console.log(`Time until expiry (ms): ${timeDiff}`);
    console.log(`Time until expiry (minutes): ${timeDiff / 60000}`);
  }
  
  return result;
}

  // NEW: Find OTP regardless of expiry status (for debugging)
  async findOTPAnyStatus(otp) {
    return prisma.user.findFirst({
      where: {
        resetOTP: otp,
      },
      select: {
        id: true,
        email: true,
        resetOTP: true,
        resetOTPExpiry: true,
      },
    });
  }

  // Clear OTP after successful reset
  async clearPasswordResetOTP(userId) {
    console.log(`Clearing OTP for user: ${userId}`);
    
    return prisma.user.update({
      where: { id: userId },
      data: {
        resetOTP: null,
        resetOTPExpiry: null,
      },
    });
  }

  // Update user password
  async updatePassword(userId, newPasswordHash) {
    console.log(`Updating password for user: ${userId}`);
    
    return prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: newPasswordHash,
      },
    });
  }
}

export { AuthRepository };