import { StorageService } from './service.js';

export class StorageController {
  constructor() {
    this.storageService = new StorageService();
  }

  // Temporary upload endpoint
  tempCoverUpload = async (req, res) => {  
    try {
      // console.log(req.body.sessionId);
      if (!req.file || !req.body.sessionId) {
        return res.status(400).json({ error: 'No file uploaded or sessionId error' });
      }
      
      const result = await this.storageService.tempCoverUpload(
        req.file, 
        req.body.type,
        req.body.sessionId
      );
      
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  finalizeUploads = async (req, res) => {
    try {
      console.log(req.body);
      const { fileReferences, packageId , uploadedById} = req.body;
      
      if (!fileReferences || !packageId) {
        return res.status(400).json({ 
          error: 'fileReferences and packageId are required' 
        });
      }

      const results = await this.storageService.finalizeUploads(
        JSON.parse(fileReferences), 
        packageId,
        uploadedById
      );

      res.status(200).json({
        success: true,
        data: results
      });

    } catch (error) {
      console.error('Finalization error:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to finalize uploads' 
      });
    }
  }

  getFileUrl = async (req, res) => {
    try {
      const { s3Key } = req.query;
      if (!s3Key) {
        return res.status(400).json({ error: 's3Key is required' });
      }
      
      const url = await this.storageService.getFileUrl(s3Key);
      res.json({ url });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get all media URLs for a tour package (for moderators)
  getTourPackageMedia = async (req, res) => {
    try {
      const { packageId } = req.params;
      
      if (!packageId || isNaN(parseInt(packageId))) {
        return res.status(400).json({ 
          success: false,
          error: 'Valid package ID is required' 
        });
      }

      const mediaWithUrls = await this.storageService.getTourPackageMediaUrls(packageId);
      
      res.status(200).json({
        success: true,
        data: mediaWithUrls
      });
    } catch (error) {
      console.error('Error fetching tour package media:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  // Get signed URLs for specific media files
  getMediaUrls = async (req, res) => {
    try {
      const { mediaIds } = req.query;
      
      if (!mediaIds) {
        return res.status(400).json({ 
          success: false,
          error: 'Media IDs are required' 
        });
      }

      const ids = Array.isArray(mediaIds) ? mediaIds : mediaIds.split(',');
      const mediaWithUrls = await this.storageService.getMediaUrls(ids);
      
      res.status(200).json({
        success: true,
        data: mediaWithUrls
      });
    } catch (error) {
      console.error('Error fetching media URLs:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  tempUploadMedia = async (req, res) => {  
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      if (!req.body.sessionId || !req.body.stopIndex) {
        return res.status(400).json({ error: 'sessionId and stopIndex are required' });
      }
      
      const type = req.body.type || 'stop_image';
      
      const result = await this.storageService.tempUploadMedia(
        req.file,
        type,
        req.body.sessionId,
        req.body.stopIndex
      );
      
      // Generate URL for immediate use
      result.url = await this.storageService.getFileUrl(result.key);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  deleteTempCover = async(req,res) => {
    try {
      const { key } = req.params;
      // console.log(key);
      await this.storageService.deleteTempCover(key);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting temp cover:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to delete temporary cover' 
      });
    }
  }

  // Add to StorageController class in controller.js
uploadVendorLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await this.storageService.uploadVendorLogo(
      req.user.id, 
      req.file
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

uploadVendorGallery = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await this.storageService.uploadVendorGalleryImage(
      req.user.id,
      req.file
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

getVendorMedia = async (req, res) => {
  try {
    const media = await this.storageService.getVendorMediaUrls(req.user.id);
    res.status(200).json({ media });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
}