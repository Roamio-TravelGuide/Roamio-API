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
      const result = await new AuthService().signup(req.body);
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
    const result = await new AuthService().verifyOTPAndResetPassword(email, otp, newPassword);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
    
}

export { AuthController };

