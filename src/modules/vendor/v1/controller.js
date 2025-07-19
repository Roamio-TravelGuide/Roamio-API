import { json } from "express";
import { VendorService } from "./service.js";
import { validationResult } from "express-validator";

export class VendorController {
  constructor() {
    this.vendorService = new VendorService();
  }

  // Validation middleware function
  validateRequest(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());

      // Return all validation errors in a friendly format
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((err) => ({
          field: err.param || err.path,
          message: err.msg,
        })),
      });
    }

    next();
  }

  async getVendorProfile(req, res) {
    try {
      const vendorId = req.user.id;

      if (!vendorId) {
        return res.status(400).json({
          success: false,
          message: "User ID is missing",
        });
      }

      // Check if vendor profile exists, create if not
      let profile = await this.vendorService.getVendorProfile(vendorId);

      if (!profile) {
        console.log(
          `No vendor profile found for user ${vendorId}, creating default profile...`
        );

        // Create a default vendor profile
        const defaultVendorData = {
          business_name: req.user.name || "New Business",
          business_description: "Welcome to our business!",
          business_license: `LICENSE_${vendorId}_${Date.now()}`,
          social_media_links: {
            instagram: "",
            facebook: "",
            website: "",
          },
        };

        profile = await this.vendorService.createVendorProfile(
          vendorId,
          defaultVendorData
        );
      }

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      console.error("Vendor Profile Error:", {
        userId: req.user?.id,
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        message: "Internal server error while fetching vendor profile",
        error:
          process.env.NODE_ENV === "development"
            ? {
                message: error.message,
                stack: error.stack,
              }
            : undefined,
      });
    }
  }
  async updateVendorProfile(req, res) {
    try {
      const vendorId = req.user.id;
      const updateData = req.body;

      console.log("Update request received:", {
        vendorId,
        updateData: JSON.stringify(updateData, null, 2),
      });

      const updatedProfile = await this.vendorService.updateVendorProfile(
        vendorId,
        updateData
      );

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedProfile,
      });
    } catch (error) {
      console.error("Error updating vendor profile:", {
        vendorId: req.user?.id,
        error: error.message,
        stack: error.stack,
        updateData: req.body,
      });

      // Handle specific error types
      if (error.code === "P2002") {
        return res.status(400).json({
          success: false,
          message: "A vendor with this information already exists",
          error:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }

      if (error.code === "P2025") {
        return res.status(404).json({
          success: false,
          message: "Vendor profile not found",
          error:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update profile",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Debug endpoint to check vendor data (development only)
  async checkVendorData(req, res) {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is only available in development mode",
      });
    }

    try {
      const result = await this.vendorService.checkAndCreateVendorData();
      res.status(200).json({
        success: true,
        message: "Vendor data check completed",
        data: result,
      });
    } catch (error) {
      console.error("Error checking vendor data:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check vendor data",
        error: error.message,
      });
    }
  }

  /*
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
    */
}
