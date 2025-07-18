import { Router } from 'express';
import multer from 'multer';
import { VendorController } from './controller.js';
import authenticate from '../../../middleware/auth.js';
import { vendorProfileValidationRules } from './validate.js';
import { validateRequest } from './validateRequest.js';

const router = Router();
const upload = multer();
const vendorController = new VendorController();

// Get vendor profile
router.get('/', authenticate, (req, res) => vendorController.getVendorProfile(req, res));

// Update vendor profile
router.put(
  '/', 
  authenticate, 
  vendorProfileValidationRules,
  validateRequest,
  (req, res) => vendorController.updateVendorProfile(req, res)
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