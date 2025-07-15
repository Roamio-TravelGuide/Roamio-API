import { VendorRepository } from './repository.js';
import { StorageService } from '../../storage/v1/service.js';

export class VendorService {
  constructor() {
    this.vendorRepository = new VendorRepository();
    this.storageService = new StorageService();
  }

  async getVendorProfile(vendorId) {
  try {
    const vendor = await this.vendorRepository.getVendorProfile(vendorId);
    
    if (!vendor) {
      throw new Error('VENDOR_NOT_FOUND');
    }

    // Safely handle missing relations
    return {
      businessName: vendor.business_name || '',
      description: vendor.business_description || '',
      email: vendor.user?.email || '',
      phone: vendor.user?.phone_no || '',
      address: vendor.user?.address || '',
      socialMedia: vendor.social_media_links || {
        instagram: '',
        facebook: '',
        website: ''
      },
      logoUrl: vendor.logo?.url || null,
      coverPhotoUrl: vendor.cover_image?.url || null
    };
  } catch (error) {
    console.error('VendorService Error:', error);
    if (error.message === 'VENDOR_NOT_FOUND') {
      error.statusCode = 404;
    }
    throw error;
  }
}

  async updateVendorProfile(vendorId, updateData) {
    const updatedVendor = await this.vendorRepository.updateVendorProfile(
      vendorId,
      {
        business_name: updateData.businessName,
        business_description: updateData.description,
        social_media_links: updateData.socialMedia
      }
    );

    // Also update user email and phone if changed
    if (updateData.email || updateData.phone) {
      await this.vendorRepository.updateUserInfo(vendorId, {
        email: updateData.email,
        phone_no: updateData.phone
      });
    }

    return this.getVendorProfile(vendorId); // Return transformed data
  }

  async uploadVendorLogo(vendorId, file) {
    // Validate file type and size
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('Only image files are allowed for logos');
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('Logo file size must be less than 5MB');
    }

    // Upload to storage
    const uploadResult = await this.storageService.uploadVendorLogo(vendorId, file);
    
    // Update vendor record with new logo
    await this.vendorRepository.updateVendorLogo(vendorId, uploadResult.mediaId);

    return {
      url: uploadResult.url
    };
  }

  async uploadVendorCover(vendorId, file) {
    // Validate file type and size
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('Only image files are allowed for cover photos');
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Cover photo size must be less than 10MB');
    }

    // Upload to storage
    const uploadResult = await this.storageService.uploadVendorCover(vendorId, file);
    
    // Update vendor record with new cover
    await this.vendorRepository.updateVendorCover(vendorId, uploadResult.mediaId);

    return {
      url: uploadResult.url
    };
  }
}