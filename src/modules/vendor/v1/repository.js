import { PrismaClient } from "@prisma/client";

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
              name: true,
              bio: true,
            },
          },
          logo: {
            select: {
              url: true,
            },
          },
          cover_image: {
            select: {
              url: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Repository Error:", error);
      throw new Error(error);
    }
  }

  async updateVendorProfile(vendorId, updateData) {
    // Only update fields that are provided
    const dataToUpdate = {
      ...updateData,
      last_updated: new Date(),
    };

    return this.prisma.vendor.update({
      where: { user_id: vendorId },
      data: dataToUpdate,
      include: {
        user: {
          select: {
            email: true,
            phone_no: true,
            name: true,
            bio: true,
          },
        },
        logo: {
          select: {
            url: true,
          },
        },
        cover_image: {
          select: {
            url: true,
          },
        },
      },
    });
  }

  async updateUserInfo(vendorId, updateData) {
    // Only update fields that are provided
    const fieldsToUpdate = {};
    if (updateData.email) fieldsToUpdate.email = updateData.email;
    if (updateData.phone_no) fieldsToUpdate.phone_no = updateData.phone_no;
    if (updateData.name) fieldsToUpdate.name = updateData.name;
    if (updateData.bio) fieldsToUpdate.bio = updateData.bio;

    return this.prisma.user.update({
      where: { id: vendorId },
      data: fieldsToUpdate,
    });
  }

  async createVendorProfile(vendorId, vendorData) {
    return this.prisma.vendor.create({
      data: {
        user_id: vendorId,
        business_name: vendorData.business_name,
        business_description: vendorData.business_description,
        business_license: vendorData.business_license,
        social_media_links: vendorData.social_media_links,
        created_at: new Date(),
        last_updated: new Date(),
      },
      include: {
        user: {
          select: {
            email: true,
            phone_no: true,
            name: true,
            bio: true,
          },
        },
        logo: {
          select: {
            url: true,
          },
        },
        cover_image: {
          select: {
            url: true,
          },
        },
      },
    });
  }

  async getAllVendorUsers() {
    return this.prisma.user.findMany({
      where: { role: "vendor" },
      include: {
        vendor_profile: true,
      },
    });
  }

  /*
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
    */
}
