import { Router } from "express";
import { AuthController } from "./controller.js";
import { authValidations } from "./validate.js";
import { validateRequest } from "../../../middleware/validation.js";

const router = Router();

router.post(
  "/login",
  validateRequest(authValidations.login),
  AuthController.login
);

router.post(
  "/signup",
  validateRequest(authValidations.signup),
  AuthController.signup
);

// Password reset routes
router.post(
  '/forgot-password',
  validateRequest(authValidations.forgotPassword),
  AuthController.forgotPassword
);

router.post(
  '/verify-otp',
  validateRequest(authValidations.resetPassword.slice(0, 2)), // email and OTP only
  AuthController.verifyOTP
);

router.post(
  '/reset-password',
  validateRequest(authValidations.resetPassword),
  AuthController.resetPasswordWithOTP
);
// Add this to your routes for debugging (remove in production)
// Add this debug route
router.post('/debug-otp-status', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await new AuthService().debugOTPStatus(email, otp);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post(
  '/reset-password-otp',
  validateRequest(authValidations.resetPassword),
  AuthController.resetPasswordWithOTP
);
export default router;