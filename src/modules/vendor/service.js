import { Repository } from './repository.js';
import { uploadToCloudinary } from '../../utils/cloudinary.js';

export class Service {
  constructor() {
    this.vendorRepo = new Repository();
  }

  async getProfile(userId) {
    const user = await this.vendorRepo.getUserWithVendorData(userId);
    
    return {
      businessName: user.business_name || user.name,
      description: user.bio || '',
      email: user.email,
      phone: user.phone_no,
      address: user.business_address || '',
      socialMedia: user.social_media || { instagram: '', facebook: '', website: '' },
      logoUrl: user.profile_picture_url,
      gallery: user.gallery || []
    };
  }

  async updateProfile(userId, data) {
    const updatedData = {
      business_name: data.businessName,
      bio: data.description,
      phone_no: data.phone,
      business_address: data.address,
      social_media: data.socialMedia
    };
    
    return this.vendorRepo.updateVendorProfile(userId, updatedData);
  }

  async uploadLogo(userId, file) {
    const result = await uploadToCloudinary(file.path);
    await this.vendorRepo.updateLogo(userId, result.secure_url);
    return result.secure_url;
  }
}