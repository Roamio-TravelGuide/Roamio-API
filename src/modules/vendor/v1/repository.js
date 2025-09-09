// modules/vendor/v1/repository.js
import { PrismaClient } from "@prisma/client";

export class VendorRepository {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async getVendorProfile(vendorId) {
    return this.prisma.vendor.findUnique({
      where: { user_id: Number(vendorId) },
      include: {
        user: { select: { email: true, phone_no: true, name: true, bio: true } },
      },
    });
  }

  async updateVendorProfile(vendorId, updateData) {
    return this.prisma.vendor.update({
      where: { user_id: Number(vendorId) },
      data: { ...updateData, last_updated: new Date() },
      include: {
        user: { select: { email: true, phone_no: true, name: true, bio: true } },
      },
    });
  }

  async updateUserInfo(vendorId, updateData) {
    return this.prisma.user.update({
      where: { id: Number(vendorId) },
      data: updateData,
    });
  }

  async createVendorProfile(vendorId, vendorData) {
    return this.prisma.vendor.create({
      data: {
        user_id: Number(vendorId),
        business_name: vendorData.business_name,
        business_description: vendorData.business_description,
        business_license: vendorData.business_license,
        social_media_links: vendorData.social_media_links,
        created_at: new Date(),
        last_updated: new Date(),
      },
      include: {
        user: { select: { email: true, phone_no: true, name: true, bio: true } },
      },
    });
  }
}
