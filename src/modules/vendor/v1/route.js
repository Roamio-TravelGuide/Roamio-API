import express from 'express';
import { VendorController } from './controller.js';
import { validateUpdateVendorProfile } from './validate.js';

const router = express.Router();
const vendorController = new VendorController();

// Get vendor profile
router.get('/', vendorController.getVendorProfile.bind(vendorController));

// Update vendor profile
router.put('/', validateUpdateVendorProfile, vendorController.updateVendorProfile.bind(vendorController));

// Upload logo (using controller's upload handler)
router.post('/logo', 
  vendorController.uploadLogo,
  vendorController.handleLogoUpload.bind(vendorController)
);

// Upload cover image
router.post('/cover', 
  vendorController.uploadCover,
  vendorController.handleCoverUpload.bind(vendorController)
);

export default router;