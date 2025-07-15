import { singleUpload } from '../utils/multer.js';
import { uploadToS3 } from '../utils/s3Upload.js';
import multer from 'multer';

export const s3UploadMiddleware = (fieldName, options = {}) => {
  return async (req, res, next) => {
    try {
      singleUpload(fieldName)(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err instanceof multer.MulterError 
              ? err.message 
              : 'File upload failed'
          });
        }

        if (!req.file) return next();

        try {
          const result = await uploadToS3(req.file, options);
          req.fileUploadResult = result;
          next();
        } catch (uploadError) {
          console.error('S3 upload error:', uploadError);
          return res.status(500).json({
            success: false,
            message: uploadError.message || 'Failed to upload file'
          });
        }
      });
    } catch (error) {
      next(error);
    }
  };
};

export default s3UploadMiddleware;