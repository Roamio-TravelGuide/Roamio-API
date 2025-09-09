import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { VendorController } from "./controller.js";
import authenticate from "../../../middleware/auth.js";
import { vendorProfileValidationRules, validateRequest } from "./validate.js";

const router = Router();
const vendorController = new VendorController();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${unique}${ext}`);
  },
});

// Multer instance with validation
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
});

/* ===========================
   Vendor Routes
   =========================== */

// Get vendor profile
router.get("/", authenticate, (req, res) =>
  vendorController.getVendorProfile(req, res)
);

// Update vendor profile (non-media fields)
router.put(
  "/",
  authenticate,
  vendorProfileValidationRules,
  validateRequest,
  (req, res) => vendorController.updateVendorProfile(req, res)
);

// Upload vendor logo (persist Media + attach to vendor)
router.post(
  "/logo",
  authenticate,
  upload.single("logo"),
  (req, res) => vendorController.uploadVendorLogo(req, res)
);

// Upload vendor cover (persist Media + attach to vendor)
router.post(
  "/cover",
  authenticate,
  upload.single("cover"),
  (req, res) => vendorController.uploadVendorCover(req, res)
);

export default router;
