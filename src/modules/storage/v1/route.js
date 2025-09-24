import { Router } from 'express';
import multer from 'multer';
import { StorageController } from './controller.js';

const router = Router();
const upload = multer();
const controller = new StorageController();


router.post('/finalize', upload.none() , controller.finalizeUploads);
router.get('/file-url', controller.getFileUrl);

router.get('/tour-package/:packageId/media', controller.getTourPackageMedia);
router.get('/media/urls', controller.getMediaUrls);

router.delete('/temp-cover/:key', controller.deleteTempCover);


export default router;