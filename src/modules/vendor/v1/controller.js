import { VendorService } from "./service.js";
import { validationResult } from "express-validator";

export class VendorController {
  constructor() {
    this.vendorService = new VendorService();
  }

  // Optional validation passthrough (if not using the shared one)
  validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((e) => ({
          field: e.param || e.path,
          message: e.msg,
        })),
      });
    }
    next();
  }

  async getVendorProfile(req, res) {
    try {
      const vendorId = req.user?.id;
      if (!vendorId) {
        return res.status(400).json({ success: false, message: "User ID is missing" });
      }

      let profile = await this.vendorService.getVendorProfile(vendorId);

      // If vendor profile doesn't exist yet, create a basic one
      if (!profile) {
        const defaultVendorData = {
          business_name: req.user?.name || "New Business",
          business_description: "Welcome to our business!",
          business_license: `LICENSE_${vendorId}_${Date.now()}`,
          social_media_links: { instagram: "", facebook: "", website: "" },
        };
        await this.vendorService.createVendorProfile(vendorId, defaultVendorData);
        profile = await this.vendorService.getVendorProfile(vendorId);
      }

      return res.status(200).json({ success: true, data: profile });
    } catch (err) {
      console.error("Vendor Profile Error:", err);
      return res.status(500).json({
        success: false,
        message: "Internal server error while fetching vendor profile",
      });
    }
  }

  async updateVendorProfile(req, res) {
    try {
      const vendorId = req.user?.id;
      const updateData = req.body;
      const updated = await this.vendorService.updateVendorProfile(vendorId, updateData);
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updated,
      });
    } catch (err) {
      console.error("Error updating vendor profile:", err);
      if (err.code === "P2002") {
        return res.status(400).json({
          success: false,
          message: "A vendor with this information already exists",
        });
      }
      if (err.code === "P2025") {
        return res.status(404).json({
          success: false,
          message: "Vendor profile not found",
        });
      }
      return res.status(500).json({ success: false, message: "Failed to update profile" });
    }
  }

  async uploadVendorLogo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const vendorId = req.user?.id;
      const filePath = `/uploads/${req.file.filename}`;
      const fullUrl = `${req.protocol}://${req.get("host")}${filePath}`;

      await this.vendorService.updateVendorProfile(vendorId, { logoUrl: fullUrl });


      // return the fresh profile so the UI updates with absolute URLs
      const profile = await this.vendorService.getVendorProfile(vendorId);

      return res.status(200).json({
        success: true,
        message: "Logo uploaded successfully",
        data: { logoUrl: fullUrl, vendor: profile },
      });
    } catch (err) {
      console.error("Error uploading vendor logo:", err);
      return res.status(500).json({ success: false, message: "Failed to upload logo" });
    }
  }

  async uploadVendorCover(req, res) {
     try {
      if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

      const vendorId = req.user?.id;
      const filePath = `/uploads/${req.file.filename}`;
      const fullUrl = `${req.protocol}://${req.get("host")}${filePath}`;

      await this.vendorService.updateVendorProfile(vendorId, { coverPhotoUrl: fullUrl });
      const profile = await this.vendorService.getVendorProfile(vendorId);

      return res.status(200).json({
        success: true,
        message: "Cover uploaded successfully",
        data: { coverUrl: fullUrl, vendor: profile },
      });
    } catch (err) {
      console.error("Error uploading vendor cover:", err);
      return res.status(500).json({ success: false, message: "Failed to upload cover image" });
    }
  }
}
