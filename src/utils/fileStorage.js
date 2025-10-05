// utils/fileStorage.js
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class LocalFileStorage {
  constructor() {
    this.basePath = path.join(process.cwd(), 'public', 'uploads');
    this.ensureDirectoryStructure();
  }

  ensureDirectoryStructure() {
    // Create main uploads directory
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }
  }

  /**
   * Generate organized directory structure for tour files
   */
  getTourDirectoryStructure(tourId, type = 'cover' || 'stop', stopId = null, mediaType = null) {
    const tourDir = path.join('tours', `tour_${tourId}`);
    
    if (type === 'cover') {
      return path.join(tourDir, 'cover');
    }
    
    if (type === 'stop' && stopId && mediaType) {
      return path.join(tourDir, 'stops', `stop_${stopId}`, mediaType);
    }
    
    return tourDir;
  }

  generateFileName(originalName, prefix = 'file') {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const uniqueId = uuidv4().substring(0, 8);
    return `${prefix}_${timestamp}_${uniqueId}${ext}`.toLowerCase();
  }

  async storeTourCover(tourId, fileBuffer, originalName) {
    try {
      const dirPath = path.join('tours', `tour_${tourId}`, 'cover');
      const fileName = this.generateFileName(originalName, `cover`);
      const fullDir = path.join(this.basePath, dirPath);
      
      // Ensure directory exists
      await fs.promises.mkdir(fullDir, { recursive: true });
      
      const filePath = path.join(fullDir, fileName);
      await fs.promises.writeFile(filePath, fileBuffer);
      
      // Return relative path for database storage
      const relativePath = path.join(dirPath, fileName);
      
      return {
        filePath: relativePath,
        url: `/uploads/${relativePath.replace(/\\/g, '/')}`, // Ensure forward slashes
        fileName,
        size: fileBuffer.length,
        mimeType: this.getMimeType(originalName)
      };
    } catch (error) {
      console.error('Error storing tour cover:', error);
      throw error;
    }
  }

  async storeStopMedia(tourId, stopIndex, mediaType, fileBuffer, originalName) {
    try {
      const dirPath = path.join('tours', `tour_${tourId}`, 'stops', `stop_${stopIndex}`, mediaType);
      const fileName = this.generateFileName(originalName, `stop_${stopIndex}_${mediaType}`);
      const fullDir = path.join(this.basePath, dirPath);
      
      await fs.promises.mkdir(fullDir, { recursive: true });
      
      const filePath = path.join(fullDir, fileName);
      await fs.promises.writeFile(filePath, fileBuffer);
      
      // Return relative path for database storage
      const relativePath = path.join(dirPath, fileName);
      
      return {
        filePath: relativePath,
        url: `/uploads/${relativePath.replace(/\\/g, '/')}`, // Ensure forward slashes
        fileName,
        size: fileBuffer.length,
        mimeType: this.getMimeType(originalName)
      };
    } catch (error) {
      console.error('Error storing stop media:', error);
      throw error;
    }
  }

  /**
   * Delete a specific file by its relative path
   */
  async deleteFile(relativePath) {
    try {
      // Remove the '/uploads/' prefix if present in the URL
      let cleanPath = relativePath;
      if (relativePath.startsWith('/uploads/')) {
        cleanPath = relativePath.substring('/uploads/'.length);
      }
      
      const fullPath = path.join(this.basePath, cleanPath);
      
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${fullPath}`);
        return false;
      }
      
      // Delete the file
      await fs.promises.unlink(fullPath);
      console.log(`Successfully deleted file: ${cleanPath}`);
      
      // Try to clean up empty directories
      await this.cleanupEmptyDirectories(path.dirname(fullPath));
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Recursively clean up empty directories
   */
  async cleanupEmptyDirectories(dirPath) {
    try {
      // Check if directory is empty
      const files = await fs.promises.readdir(dirPath);
      
      if (files.length === 0) {
        // Directory is empty, delete it
        await fs.promises.rmdir(dirPath);
        console.log(`Deleted empty directory: ${dirPath}`);
        
        // Recursively check parent directory
        const parentDir = path.dirname(dirPath);
        if (parentDir !== this.basePath && parentDir.startsWith(this.basePath)) {
          await this.cleanupEmptyDirectories(parentDir);
        }
      }
    } catch (error) {
      // Ignore errors in directory cleanup (non-empty directories, etc.)
      console.log(`Directory not empty or cannot be deleted: ${dirPath}`);
    }
  }

  async deleteTourFiles(tourId) {
    try {
      const tourDir = this.getTourDirectoryStructure(tourId);
      const fullPath = path.join(this.basePath, tourDir);
      
      if (fs.existsSync(fullPath)) {
        await fs.promises.rm(fullPath, { recursive: true, force: true });
        console.log(`Deleted tour files for tour ${tourId}`);
        return true;
      }
      console.log(`No files found for tour ${tourId}`);
      return false;
    } catch (error) {
      console.error('Error deleting tour files:', error);
      return false;
    }
  }

  getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  getPublicUrl(relativePath) {
    // Remove any leading slashes and ensure proper URL format
    const cleanPath = relativePath.replace(/^[\\/]/, '').replace(/\\/g, '/');
    return `/uploads/${cleanPath}`;
  }

  async fileExists(relativePath) {
    try {
      const fullPath = path.join(this.basePath, relativePath);
      await fs.promises.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileStats(relativePath) {
    try {
      const fullPath = path.join(this.basePath, relativePath);
      return await fs.promises.stat(fullPath);
    } catch (error) {
      console.error('Error getting file stats:', error);
      return null;
    }
  }
}

export default new LocalFileStorage();