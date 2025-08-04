import { StorageService } from './service.js';

export class StorageController {
  constructor() {
    this.storageService = new StorageService();
  }

  tempCoverUpload = async (req, res) => {  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // console.log(req.body.tour_id);

    if (req.body.sessionId) {
      if (!req.body.type) {
        return res.status(400).json({ error: 'Type is required for new uploads' });
      }
      
      const result = await this.storageService.tempCoverUpload(
        req.file, 
        req.body.type,
        req.body.sessionId
      );
      
      return res.status(200).json(result);
    }

    else if (req.body.tour_id) {

      // console.log(req.body.tour_id);

      if (!req.body.type) {
        return res.status(400).json({ error: 'Type is required for tour updates' });
      }
      
      const result = await this.storageService.updateTourCover(
        req.file,
        req.body.type,
        req.body.tour_id
      );
      
      return res.status(200).json(result);
    }
    else {
      return res.status(400).json({ error: 'Either sessionId or tourId must be provided' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


  finalizeUploads = async (req, res) => {
    try {
      const { fileReferences, packageId, uploadedById } = req.body;
      
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

      if (!req.body.stopIndex) {
        return res.status(400).json({ error: 'stopIndex is required' });
      }

      const hasSessionId = !!req.body.sessionId;
      const hasTourId = !!req.body.tour_id;
      
      if (!hasSessionId && !hasTourId) {
        return res.status(400).json({ error: 'Either sessionId or tour_id is required' });
      }
      
      if (hasSessionId && hasTourId) {
        return res.status(400).json({ error: 'Provide either sessionId or tour_id, not both' });
      }

      const type = req.body.type || 'stop_image';
      let result;

      if (hasTourId) {
        result = await this.storageService.uploadMedia(
          req.file,
          type,
          req.body.tour_id,
          req.body.stopIndex
        );
      } else {
        result = await this.storageService.tempUploadMedia(
          req.file,
          type,
          req.body.sessionId,
          req.body.stopIndex
        );
      }
      
      result.url = await this.storageService.getFileUrl(result.key);
      res.status(200).json(result);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  deleteTempCover = async(req, res) => {
    try {
      const { key } = req.params;
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

  async updateTourPackage(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid tour package ID'
        });
      }

      if (updateData.mediaUpdates) {
        try {
          await this.storageService.handleMediaUpdates(
            parseInt(id),
            updateData.mediaUpdates
          );
        } catch (mediaError) {
          console.error('Media update failed:', mediaError);
          return res.status(500).json({
            success: false,
            message: 'Failed to process media updates'
          });
        }
      }

      const updatedPackage = await tourPackageService.updateTourPackage(
        parseInt(id),
        updateData
      );

      if (!updatedPackage) {
        return res.status(404).json({
          success: false,
          message: 'Tour package not found'
        });
      }

      if (updateData.sessionId) {
        try {
          await this.storageService.cleanupTempFiles(updateData.sessionId);
        } catch (cleanupError) {
          console.error('Temp cleanup failed:', cleanupError);
        }
      }

      return res.status(200).json({
        success: true,
        data: updatedPackage
      });
    } catch (error) {
      console.error('Error updating tour package:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }
}