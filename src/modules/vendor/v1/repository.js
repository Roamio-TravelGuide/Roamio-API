import { PrismaClient } from '@prisma/client';

export class VendorRepository {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async getVendorProfile(vendorId) {
  try {
    return await this.prisma.vendor.findUnique({
      where: { user_id: parseInt(vendorId) },
      include: {
        user: {
          select: {
            email: true,
            phone_no: true,
            
          }
        },
        logo: {
          select: {
            url: true
          }
        },
        cover_image: {
          select: {
            url: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Repository Error:', error);
    throw new Error(error);
  }
}

  async updateVendorProfile(vendorId, updateData) {
    return this.prisma.vendor.update({
      where: { user_id: vendorId },
      data: {
        business_name: updateData.business_name,
        business_description: updateData.business_description,
        social_media_links: updateData.social_media_links,
        last_updated: new Date()
      },
      include: {
        user: true,
        logo: true,
        cover_image: true
      }
    });
  }

  async updateUserInfo(vendorId, updateData) {
    return this.prisma.user.update({
      where: { id: vendorId },
      data: {
        email: updateData.email,
        phone_no: updateData.phone,
        
      }
    });
  }

  async updateVendorLogo(vendorId, mediaId) {
    return this.prisma.vendor.update({
      where: { user_id: vendorId },
      data: {
        logo_id: mediaId,
        last_updated: new Date()
      }
    });
  }

  async updateVendorCover(vendorId, mediaId) {
    return this.prisma.vendor.update({
      where: { user_id: vendorId },
      data: {
        cover_image_id: mediaId,
        last_updated: new Date()
      }
    });
  }
}