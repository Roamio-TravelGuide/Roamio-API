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
}