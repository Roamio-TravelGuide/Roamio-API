import { VendorService } from './service.js';

export class VendorController {
  constructor() {
    this.vendorService = new VendorService();
  }

  async getVendorProfile(req, res) {
  try {
    const vendorId = req.user.id;
    
    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is missing'
      });
    }

    const profile = await this.vendorService.getVendorProfile(vendorId);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found. Please complete your profile setup.'
      });
    }
    
    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Vendor Profile Error:', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching vendor profile',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
}
  async updateVendorProfile(req, res) {
    try {
      const vendorId = req.user.id;
      const updateData = req.body;

      const updatedProfile = await this.vendorService.updateVendorProfile(vendorId, updateData);
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      console.error('Error updating vendor profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async uploadVendorLogo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const vendorId = req.user.id;
      const result = await this.vendorService.uploadVendorLogo(vendorId, req.file);
      
      res.status(200).json({
        success: true,
        message: 'Logo uploaded successfully',
        data: {
          logoUrl: result.url
        }
      });
    } catch (error) {
      console.error('Error uploading vendor logo:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload logo',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async uploadVendorCover(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const vendorId = req.user.id;
      const result = await this.vendorService.uploadVendorCover(vendorId, req.file);
      
      res.status(200).json({
        success: true,
        message: 'Cover image uploaded successfully',
        data: {
          coverUrl: result.url
        }
      });
    } catch (error) {
      console.error('Error uploading vendor cover:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload cover image',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}