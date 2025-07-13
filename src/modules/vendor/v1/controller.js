import { VendorService } from './service.js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Configure multer directly in the controller
const uploadConfig = multer({
  storage: multer.memoryStorage(), // Store files in memory for processing
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Single file per upload
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

export class VendorController {
    constructor() {
        this.vendorService = new VendorService();
    }

    // Handle logo upload
    uploadLogo = uploadConfig.single('logo');

    // Handle cover upload
    uploadCover = uploadConfig.single('cover');

    async getVendorProfile(req, res) {
        try {
            const userId = req.user.id;
            const vendorProfile = await this.vendorService.getVendorProfile(userId);
            
            res.status(200).json({
                success: true,
                data: vendorProfile
            });
        } catch (error) {
            console.error('Error fetching vendor profile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch vendor profile',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async updateVendorProfile(req, res) {
        try {
            const userId = req.user.id;
            const updateData = req.body;
            
            const updatedProfile = await this.vendorService.updateVendorProfile(userId, updateData);
            
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: updatedProfile
            });
        } catch (error) {
            console.error('Error updating vendor profile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update vendor profile',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async handleLogoUpload(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const userId = req.user.id;
            const logoUrl = await this.vendorService.uploadLogo(userId, req.file);
            
            res.status(200).json({
                success: true,
                message: 'Logo uploaded successfully',
                data: { logoUrl }
            });
        } catch (error) {
            console.error('Error uploading logo:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to upload logo',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    async handleCoverUpload(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const userId = req.user.id;
            const coverUrl = await this.vendorService.uploadCoverImage(userId, req.file);
            
            res.status(200).json({
                success: true,
                message: 'Cover image uploaded successfully',
                data: { coverUrl }
            });
        } catch (error) {
            console.error('Error uploading cover image:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to upload cover image',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}