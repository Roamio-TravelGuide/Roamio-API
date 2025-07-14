import { 
  PutObjectCommand, 
  CopyObjectCommand, 
  DeleteObjectCommand, 
  GetObjectCommand,
  HeadObjectCommand  // Added missing import
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, bucketName } from '../../../config/s3.config.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class StorageRepository {
  async uploadFile({ file, key, contentType, onUploadProgress }) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: contentType,
      });

      const abortController = new AbortController();
      const timeout = setTimeout(() => abortController.abort(), 30000);

      const response = await s3Client.send(command, { 
        abortSignal: abortController.signal 
      }).finally(() => clearTimeout(timeout));

      if (onUploadProgress) {
        onUploadProgress({ loaded: file.buffer.length, total: file.buffer.length });
      }

      return { key };
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error.name !== 'AbortError') {
        try {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key
          }));
        } catch (cleanupError) {
          console.error('Cleanup failed:', cleanupError);
        }
      }

      throw new Error(error.name === 'AbortError' 
        ? 'Upload timed out' 
        : 'Failed to upload file');
    }
    }

  async moveFile(sourceKey, destinationKey) {
    try {
      // Copy the file to new location
      await s3Client.send(new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: `/${bucketName}/${encodeURIComponent(sourceKey)}`,
        Key: destinationKey
      }));
      
      // Delete the original file
      await this.deleteFile(sourceKey);
      return { success: true };
    } catch (error) {
      console.error('Move file error:', error);
      throw new Error('Failed to move file');
    }
  }

  async getSignedUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      console.error('URL generation error:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  async getFileUrl(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      return await getSignedUrl(s3Client, command, { expiresIn: 3600 * 24 * 7 });
    } catch (error) {
      console.error('URL generation error:', error);
      throw new Error('Failed to generate file URL');
    }
  }

  async createMediaRecord(data) {
    try {
      return await prisma.media.create({
        data: {
          url: data.url,
          s3_key: data.s3_key,
          media_type: data.media_type,
          duration_seconds: data.duration_seconds,
          uploaded_by_id: parseInt(data.uploaded_by_id),
          file_size: data.file_size,
          format: data.format,
          created_at: new Date()
        }
      });
    } catch (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create media record');
    }
  }

  async checkFileExists(key) {
    try {
      const command = new HeadObjectCommand({ 
        Bucket: bucketName,
        Key: key,
      });
      await s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {  
        return false;
      }
      console.error('File existence check error:', error);
      throw error;
    }
  }

  async deleteFile(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      await s3Client.send(command);
      return { success: true };
    } catch (error) {
      console.error('Delete error:', error);
      throw new Error('Failed to delete file');
    }
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}