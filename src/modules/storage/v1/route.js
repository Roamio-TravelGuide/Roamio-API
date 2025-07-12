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

export default router;