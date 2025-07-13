import { Service } from './service.js';

export class Controller {
  constructor() {
    this.Service = new Service();
  }

  async getVendorProfile(req, res) {
    try {
      const userId = req.user.id; // From auth middleware
      const profile = await this.vendorService.getProfile(userId);
      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch vendor profile'
      });
    }
  }

  async updateVendorProfile(req, res) {
    try {
      const userId = req.user.id;
      const updatedData = req.body;
      const profile = await this.vendorService.updateProfile(userId, updatedData);
      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async uploadLogo(req, res) {
    try {
      const userId = req.user.id;
      const logoUrl = await this.vendorService.uploadLogo(userId, req.file);
      res.json({
        success: true,
        data: { logoUrl }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Logo upload failed'
      });
    }
  }
}