import express from 'express';
import { Controller } from './controller.js';
import { validateVendorProfile } from './validate.js';
import upload from '../../middleware/multer.js';

const router = express.Router();
const vendorController = new Controller();

// Get vendor profile
router.get('/profile', vendorController.getVendorProfile);

// Update profile
router.put('/profile', validateVendorProfile, vendorController.updateVendorProfile);

// Upload logo
router.post('/logo', upload.single('logo'), vendorController.uploadLogo);

export default router;