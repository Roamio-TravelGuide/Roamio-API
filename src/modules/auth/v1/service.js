import { AuthRepository } from "./repository.js";
import {
  comparePasswords,
  generateToken,
  hashPassword,
} from "../../../utils/index.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

class AuthService {
  constructor() {
    this.authRepository = new AuthRepository();
    // Create transporter once and reuse it
    this.transporter = nodemailer.createTransport({
      secure: true,
      host: "smtp.gmail.com",
      port: 465,
      auth: {
        user: "mohamadshimhan@gmail.com",
        pass: "mepk wjfy lixr tvba",
      },
    });

    // Verify transporter connection on initialization
    this.verifyTransporter();
  }

  // Verify the transporter configuration
  async verifyTransporter() {
    try {
      await this.transporter.verify();
      console.log("Email transporter is ready to send messages");
    } catch (error) {
      console.error("Email transporter configuration error:", error);
    }
  }

  async login(loginData) {
    const user = await this.authRepository.findUserByEmail(loginData.email);

    if (!user) throw new Error("User not found");

    // Check if user status is pending
    if (user.status === "pending") {
      throw new Error(
        "Your account is pending approval. Please wait for admin approval or check your email for updates."
      );
    }

    const isPasswordValid = await comparePasswords(
      loginData.password,
      user.password_hash
    );
    if (!isPasswordValid) throw new Error("Invalid credentials");

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile_picture_url: user.profile_picture_url,
      },
    };
  }

  async signup(userData) {
    const existingUser = await this.authRepository.findUserByEmail(
      userData.email
    );
    if (existingUser) {
      throw new Error("User already exists");
    }
    if (!userData.password) {
      throw new Error("Password is required");
    }

    const hashedPassword = await hashPassword(userData.password);
    // Prepare the user data for creation
    const userToCreate = {
      ...userData,
      password_hash: hashedPassword,
    };

    // Create the user with role-specific data
    const user = await this.authRepository.createUser(userToCreate);

    // Generate token for immediate login after signup
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile_picture_url: user.profile_picture_url,
      },
    };
  }
  
  // Replace the forgotPassword and resetPassword methods with these:

// Send OTP via email
// Send OTP via email - INCREASE EXPIRY TIME
async forgotPassword(email) {
  const user = await this.authRepository.findUserByEmail(email);
  if (!user) {
    console.log(`Password reset requested for: ${email} (user not found)`);
    return {
      success: true,
      message: "If the email exists, an OTP has been sent",
    };
  }

  // Generate 6-digit OTP - Use UTC time for expiry
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 1 * 60 * 1000); // 1 minute expiry
  const utcOtpExpiry = new Date(otpExpiry.toISOString()); // Convert to UTC
  
  console.log(`Generated OTP: ${otp}, Expiry (UTC): ${utcOtpExpiry}, Current time (UTC): ${new Date().toISOString()}`);

  // Save OTP to database with UTC time
  await this.authRepository.savePasswordResetOTP(user.id, otp, utcOtpExpiry);

  try {
    // Send OTP email
    const info = await this.transporter.sendMail({
      from: '"Roamio Support" <mohamadshimhan@gmail.com>',
      to: user.email,
      subject: "Password Reset OTP - Roamio Tour Guide",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Password Reset OTP</h2>
          <p>Hello ${user.name},</p>
          <p>You requested to reset your password for your Roamio Tour Guide account.</p>
          <p>Your OTP code is:</p>
          <div style="text-align: center; margin: 25px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4CAF50;">
              ${otp}
            </div>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #888; font-size: 12px;">
            This is an automated message from Roamio Tour Guide. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    console.log("Password reset OTP sent successfully. Message ID:", info.messageId);
    return {
      success: true,
      message: "OTP sent successfully",
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP. Please try again later.");
  }
}

// Add better error handling for OTP verification
async verifyOTP(email, otp) {
  console.log(`Verifying OTP only for email: ${email}, OTP: ${otp}`);
  
  if (!email || !otp) {
    throw new Error("Email and OTP are required");
  }

  const user = await this.authRepository.findUserByEmail(email);
  if (!user) {
    console.log("User not found for email:", email);
    throw new Error("Invalid request");
  }

  const userWithOTP = await this.authRepository.findUserByResetOTP(otp);
  console.log("User with OTP:", userWithOTP);
  
  if (!userWithOTP) {
    // Check if OTP exists but expired
    const expiredOTPUser = await prisma.user.findFirst({
      where: {
        resetOTP: otp,
        resetOTPExpiry: {
          lt: new Date(), // Find expired OTPs
        },
      },
    });
    
    if (expiredOTPUser) {
      console.log("OTP has expired");
      throw new Error("OTP has expired. Please request a new one.");
    }
    
    console.log("No user found with this OTP");
    throw new Error("Invalid OTP");
  }

  if (userWithOTP.id !== user.id) {
    console.log("OTP user mismatch:", userWithOTP.id, "vs", user.id);
    throw new Error("Invalid OTP");
  }

  console.log("OTP verified successfully");
  return { success: true, message: "OTP verified successfully" };
}

// Verify OTP and reset password
async verifyOTPAndResetPassword(email, otp, newPassword) {
  console.log(`Verifying OTP for email: ${email}, OTP: ${otp}`);
  
  if (!email || !otp || !newPassword) {
    throw new Error("Email, OTP, and new password are required");
  }

  // Find user by email first
  const user = await this.authRepository.findUserByEmail(email);
  if (!user) {
    console.log("User not found for email:", email);
    throw new Error("Invalid request");
  }

  console.log("User found:", user.id);

  // Verify OTP
  const userWithOTP = await this.authRepository.findUserByResetOTP(otp);
  console.log("User with OTP:", userWithOTP);
  
  if (!userWithOTP) {
    console.log("No user found with this OTP or OTP expired");
    throw new Error("Invalid or expired OTP");
  }

  if (userWithOTP.id !== user.id) {
    console.log("OTP user mismatch:", userWithOTP.id, "vs", user.id);
    throw new Error("Invalid or expired OTP");
  }

  console.log("OTP verified successfully for user:", user.id);

  // Update password
  const hashedPassword = await hashPassword(newPassword);
  await this.authRepository.updatePassword(user.id, hashedPassword);
  await this.authRepository.clearPasswordResetOTP(user.id);

  return { success: true, message: "Password reset successfully" };
}

// Similarly add debug logs to verifyOTP method
async verifyOTP(email, otp) {
  console.log(`Verifying OTP only for email: ${email}, OTP: ${otp}`);
  
  if (!email || !otp) {
    throw new Error("Email and OTP are required");
  }

  const user = await this.authRepository.findUserByEmail(email);
  if (!user) {
    console.log("User not found for email:", email);
    throw new Error("Invalid request");
  }

  const userWithOTP = await this.authRepository.findUserByResetOTP(otp);
  console.log("User with OTP:", userWithOTP);
  
  if (!userWithOTP || userWithOTP.id !== user.id) {
    console.log("Invalid OTP or mismatch");
    throw new Error("Invalid or expired OTP");
  }

  console.log("OTP verified successfully");
  return { success: true, message: "OTP verified successfully" };
}
// Add a method to verify OTP without resetting password
async verifyOTP(email, otp) {
  if (!email || !otp) {
    throw new Error("Email and OTP are required");
  }

  const user = await this.authRepository.findUserByEmail(email);
  if (!user) {
    throw new Error("Invalid request");
  }

  const userWithOTP = await this.authRepository.findUserByResetOTP(otp);
  if (!userWithOTP || userWithOTP.id !== user.id) {
    throw new Error("Invalid or expired OTP");
  }

  return { success: true, message: "OTP verified successfully" };
}

// Add this debug method to your service
// Add to AuthService class
async debugOTPStatus(email, otp) {
  console.log("=== OTP DEBUG INFO ===");
  console.log("Current server time:", new Date());
  console.log("UTC time:", new Date().toUTCString());
  
  const user = await this.authRepository.findUserByEmail(email);
  if (!user) {
    return { error: "User not found" };
  }
  
  // Find OTP regardless of expiry
  const otpRecord = await prisma.user.findFirst({
    where: {
      email: email,
      resetOTP: otp
    },
    select: {
      id: true,
      resetOTP: true,
      resetOTPExpiry: true
    }
  });
  
  if (!otpRecord) {
    return { error: "OTP not found" };
  }
  
  const currentTime = new Date();
  const expiryTime = new Date(otpRecord.resetOTPExpiry);
  const isExpired = expiryTime < currentTime;
  const timeUntilExpiry = expiryTime - currentTime;
  
  return {
    userEmail: email,
    otp: otpRecord.resetOTP,
    expiryTime: expiryTime,
    currentTime: currentTime,
    isExpired: isExpired,
    timeUntilExpiryMs: timeUntilExpiry,
    timeUntilExpiryMinutes: timeUntilExpiry / (1000 * 60),
    databaseRecord: otpRecord
  };
}
  
  
}

export { AuthService };
