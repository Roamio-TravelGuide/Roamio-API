import { Upload } from '@aws-sdk/lib-storage';
import { s3Client, bucketName } from '../config/s3.config.js';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

/**
 * Upload file to S3
 * @param {Object} file - File object from multer
 * @param {Object} options - Upload options
 * @param {string} options.folder - Folder path in S3 bucket
 * @param {number} options.maxSize - Maximum file size in bytes
 * @returns {Promise<{url: string, key: string}>} Upload result
 */
const uploadToS3 = async (file, options = {}) => {
  const { folder = '', maxSize = 10 * 1024 * 1024 } = options;
  
  // Check file size
  if (file.size > maxSize) {
    throw new Error(`File size exceeds maximum limit of ${maxSize / 1024 / 1024}MB`);
  }

  const fileStream = fs.createReadStream(file.path);
  const fileExt = path.extname(file.originalname);
  const contentType = mime.lookup(fileExt) || 'application/octet-stream';
  const key = `${folder}/${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;

  try {
    const parallelUploads3 = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: fileStream,
        ContentType: contentType,
        ACL: 'public-read' // Adjust based on your requirements
      },
      queueSize: 4, // Optional concurrency configuration
      partSize: 5 * 1024 * 1024, // Optional part size (5MB)
      leavePartsOnError: false // Optional cleanup on failure
    });

    await parallelUploads3.done();
    
    // Generate public URL (adjust if using CloudFront)
    const url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { url, key };
  } finally {
    // Clean up temp file
    fs.unlink(file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 */
const deleteFromS3 = async (key) => {
  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    }));
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
};

export { uploadToS3, deleteFromS3 };