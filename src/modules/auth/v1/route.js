import { Router } from "express";
import { AuthController } from "./controller.js";
import { authValidations } from "./validate.js";
import { validateRequest } from "../../../middleware/validation.js";
import multer from "multer";
import path from "path";


const router = Router();

router.post(
  "/login",
  validateRequest(authValidations.login),
  AuthController.login
);
router.get(
  '/logout', 
  AuthController.logout
);


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/guideDocuments"); // Save here
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // keep extension
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
  }
};

const upload = multer({ storage, fileFilter });

router.post(
  "/signup",
  upload.single("verificationDocument"),  // expects field name "verificationDocument"
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