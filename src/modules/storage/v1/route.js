import { Router } from 'express';
import multer from 'multer';
import { StorageController } from './controller.js';

const router = Router();
const upload = multer();
const controller = new StorageController();

router.post('/temp-cover', upload.single('file'), controller.tempCoverUpload);
router.post('/temp-media', upload.single('file'), controller.tempUploadMedia);
router.post('/finalize', upload.none() , controller.finalizeUploads);
router.get('/file-url', controller.getFileUrl);

// Routes for moderator media access
router.get('/tour-package/:packageId/media', controller.getTourPackageMedia);
router.get('/media/urls', controller.getMediaUrls);

router.delete('/temp-cover/:key', controller.deleteTempCover);

// Add to route.js after existing routes
router.post('/vendor/logo', upload.single('logo'), controller.uploadVendorLogo);
router.post('/vendor/gallery', upload.single('image'), controller.uploadVendorGallery);
router.get('/vendor/media', controller.getVendorMedia);
export default router;