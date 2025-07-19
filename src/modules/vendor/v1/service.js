import { VendorRepository } from "./repository.js";
//import { StorageService } from '../../storage/v1/service.js';

export class VendorService {
  constructor() {
    this.vendorRepository = new VendorRepository();
    //this.storageService = new StorageService();
  }

  async getVendorProfile(vendorId) {
    try {
      const vendor = await this.vendorRepository.getVendorProfile(vendorId);

      if (!vendor) {
        return null; // Return null instead of throwing error, let controller handle creation
      }

      // Safely handle missing relations and return formatted data
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
        socialMedia: vendor.social_media_links || {
          instagram: "",
          facebook: "",
          website: "",
        },
        logoUrl: vendor.logo?.url || null,
        coverPhotoUrl: vendor.cover_image?.url || null,
        createdAt: vendor.created_at,
        lastUpdated: vendor.last_updated,
      };
    } catch (error) {
      console.error("VendorService Error:", error);
      throw error;
    }
  }

  async createVendorProfile(vendorId, vendorData) {
    try {
      const newVendor = await this.vendorRepository.createVendorProfile(
        vendorId,
        vendorData
      );
      return this.getVendorProfile(vendorId); // Return formatted data
    } catch (error) {
      console.error("VendorService Create Error:", error);
      throw error;
    }
  }

  async updateVendorProfile(vendorId, updateData) {
    try {
      // Prepare vendor update data
      const vendorUpdateData = {};
      if (updateData.businessName)
        vendorUpdateData.business_name = updateData.businessName;
      if (updateData.description)
        vendorUpdateData.business_description = updateData.description;
      if (updateData.socialMedia)
        vendorUpdateData.social_media_links = updateData.socialMedia;
      if (updateData.businessWebsite)
        vendorUpdateData.business_website = updateData.businessWebsite;
      if (updateData.tagline) vendorUpdateData.tagline = updateData.tagline;

      // Update vendor table
      const updatedVendor = await this.vendorRepository.updateVendorProfile(
        vendorId,
        vendorUpdateData
      );

      // Prepare user update data
      const userUpdateData = {};
      if (updateData.email) userUpdateData.email = updateData.email;
      if (updateData.phone) userUpdateData.phone_no = updateData.phone;
      if (updateData.name) userUpdateData.name = updateData.name;
      if (updateData.bio) userUpdateData.bio = updateData.bio;

      // Update user table if there's user data to update
      if (Object.keys(userUpdateData).length > 0) {
        await this.vendorRepository.updateUserInfo(vendorId, userUpdateData);
      }

      // Return the updated profile
      return this.getVendorProfile(vendorId);
    } catch (error) {
      console.error("VendorService Update Error:", error);
      throw error;
    }
  }
  /*
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

  // Check and create vendor data for development/debugging
  async checkAndCreateVendorData() {
    try {
      console.log('Checking vendor data...');
      
      // Get all users with vendor role
      const vendorUsers = await this.vendorRepository.getAllVendorUsers();
      
      console.log('Vendor users found:', vendorUsers.length);
      
      const results = [];
      
      for (const [index, user] of vendorUsers.entries()) {
        const userInfo = {
          index: index + 1,
          userId: user.id,
          email: user.email,
          hasVendorProfile: !!user.vendor_profile,
          profileData: null
        };

        console.log(`\nVendor ${index + 1}:`);
        console.log('User ID:', user.id);
        console.log('Email:', user.email);
        console.log('Has vendor profile:', !!user.vendor_profile);
        
        if (user.vendor_profile) {
          console.log('Business name:', user.vendor_profile.business_name);
          console.log('Verification status:', user.vendor_profile.verification_status);
          userInfo.profileData = {
            businessName: user.vendor_profile.business_name,
            verificationStatus: user.vendor_profile.verification_status
          };
        } else {
          // Create a sample vendor profile for users without one
          console.log('Creating sample vendor profile...');
          const sampleVendorData = {
            business_name: `Sample Business ${index + 1}`,
            business_description: 'A sample business for testing',
            business_license: `SAMPLE${user.id}_${Date.now()}`,
            social_media_links: {
              instagram: '',
              facebook: '',
              website: ''
            }
          };

          const newVendor = await this.vendorRepository.createVendorProfile(user.id, sampleVendorData);
          console.log('Sample vendor created:', newVendor.business_name);
          userInfo.profileData = {
            businessName: newVendor.business_name,
            verificationStatus: newVendor.verification_status,
            created: true
          };
        }
        
        results.push(userInfo);
      }

      return {
        totalVendorUsers: vendorUsers.length,
        results: results
      };
      
    } catch (error) {
      console.error('Error checking vendor data:', error);
      throw error;
    }
  }
    */
}
