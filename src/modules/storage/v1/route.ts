// // src/modules/storage/v1/routes.ts
// import express from 'express';
// import { MediaController } from './controller';
// import { upload } from '../../../utils/multer'; // Your existing Multer config
// import { authenticate } from '../../../middleware/auth'; // Your auth middleware

// const router = express.Router();

// router.post(
//   '/upload',
//   authenticate,
//   upload.single('file'),
//   // MediaController.upload
// );

// export default router;