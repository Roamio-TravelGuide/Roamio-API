// import multer from 'multer';
// import { Request } from 'express';

// const storage = multer.memoryStorage();

// const fileFilter = (
//   req: Request, 
//   file: Express.Multer.File, 
//   cb: multer.FileFilterCallback
// ) => {
//   if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
//     cb(null, true);
//   } else {
//     cb(null, false);
//   }
// };

// export const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 10 * 1024 * 1024 }
// });