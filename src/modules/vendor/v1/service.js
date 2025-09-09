// modules/vendor/v1/service.js
import { VendorRepository } from "./repository.js";

export class VendorService {
  constructor() {
    this.vendorRepository = new VendorRepository();
  }

  async getVendorProfile(vendorId) {
    const vendor = await this.vendorRepository.getVendorProfile(vendorId);
    if (!vendor) return null;

    return {
      businessName: vendor.business_name || "",
      description: vendor.business_description || "",
      email: vendor.user?.email || "",
      phone: vendor.user?.phone_no || "",
      name: vendor.user?.name || "",
      bio: vendor.user?.bio || "",
      businessType: vendor.business_type || "other",
      businessWebsite: vendor.business_website || "",
      tagline: vendor.tagline || "",
      businessLicense: vendor.business_license || "",
      verificationStatus: vendor.verification_status || "pending_approval",
      rejectionReason: vendor.rejection_reason || "",
      isActive: vendor.is_active || false,
      averageRating: vendor.average_rating || 0,
      socialMedia: vendor.social_media_links || { instagram: "", facebook: "", website: "" },
      logoUrl: vendor.logo_url || null,
      coverPhotoUrl: vendor.cover_url || null,
      createdAt: vendor.created_at,
      lastUpdated: vendor.last_updated,
    };
  }

  async createVendorProfile(vendorId, vendorData) {
    await this.vendorRepository.createVendorProfile(vendorId, vendorData);
    return this.getVendorProfile(vendorId);
  }

  async updateVendorProfile(vendorId, updateData) {
    const vendorUpdateData = {};
    if (updateData.businessName) vendorUpdateData.business_name = updateData.businessName;
    if (updateData.description) vendorUpdateData.business_description = updateData.description;
    if (updateData.socialMedia) vendorUpdateData.social_media_links = updateData.socialMedia;
    if (updateData.businessWebsite) vendorUpdateData.business_website = updateData.businessWebsite;
    if (updateData.tagline) vendorUpdateData.tagline = updateData.tagline;

    // ✅ map media URLs
    if (updateData.logoUrl) vendorUpdateData.logo_url = updateData.logoUrl;
    if (updateData.coverPhotoUrl) vendorUpdateData.cover_url = updateData.coverPhotoUrl;

    await this.vendorRepository.updateVendorProfile(vendorId, vendorUpdateData);

    const userUpdateData = {};
    if (updateData.email) userUpdateData.email = updateData.email;
    if (updateData.phone) userUpdateData.phone_no = updateData.phone;
    if (updateData.name) userUpdateData.name = updateData.name;
    if (updateData.bio) userUpdateData.bio = updateData.bio;

    if (Object.keys(userUpdateData).length > 0) {
      await this.vendorRepository.updateUserInfo(vendorId, userUpdateData);
    }

    return this.getVendorProfile(vendorId);
  }
}
