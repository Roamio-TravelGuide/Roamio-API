import { AuthService } from "./service.js";

class AuthController {
  static async login(req, res, next) {
    try {
      const result = await new AuthService().login(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

static async signup(req, res, next) {
  try {
    const userData = req.body;

    // If guide uploads document
    if (req.file) {
      userData.verification_documents = `/uploads/guideDocuments/${req.file.filename}`;
    }

    const result = await new AuthService().signup(userData);
    res.status(201).json(result);
  } catch (error) {
    next({ status: 409, message: error.message });
  }
}

  // Send password reset email/token
  static async forgotPassword(req, res, next) {
    try {
      const result = await new AuthService().forgotPassword(req.body.email);
      res.json(result); // Return the actual result from service
    } catch (error) {
      next(error);
    }
  }

  // Verify OTP
  static async verifyOTP(req, res, next) {
    try {
      const { email, otp } = req.body;
      const result = await new AuthService().verifyOTP(email, otp);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Reset password with OTP
  static async resetPasswordWithOTP(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body;
      const result = await new AuthService().verifyOTPAndResetPassword(
        email,
        otp,
        newPassword
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      // Extract token from Authorization header if present
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      await new AuthService().logout(token);
      
      // Always return a proper JSON response
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      // Handle errors properly
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: error.message
      });
    }
  }
}

export { AuthController };
