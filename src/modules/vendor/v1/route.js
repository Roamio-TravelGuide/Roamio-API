import { Router } from "express";
import multer from "multer";
import { VendorController } from "./controller.js";
import authenticate from "../../../middleware/auth.js";
import { vendorProfileValidationRules, validateRequest } from "./validate.js";

const router = Router();
const upload = multer();
const vendorController = new VendorController();

// Get vendor profile
router.get("/", authenticate, (req, res) =>
  vendorController.getVendorProfile(req, res)
);

// Update vendor profile
router.put(
  "/",
  authenticate,
  (req, res, next) => {
    console.log("PUT /vendor - Request received");
    console.log("User:", req.user?.id);
    console.log("Body:", JSON.stringify(req.body, null, 2));
    next();
  },
  vendorProfileValidationRules,
  validateRequest,
  (req, res) => vendorController.updateVendorProfile(req, res)
);

// Debug endpoint to check vendor data (development only)
router.get("/debug/check-data", authenticate, (req, res) =>
  vendorController.checkVendorData(req, res)
);

/*
// Upload vendor logo
router.post(
  '/logo', 
  authenticate, 
  upload.single('logo'),
  (req, res) => vendorController.uploadVendorLogo(req, res)
);

// Upload vendor cover photo
router.post(
  '/cover', 
  authenticate, 
  upload.single('cover'),
  (req, res) => vendorController.uploadVendorCover(req, res)
);
*/
export default router;
