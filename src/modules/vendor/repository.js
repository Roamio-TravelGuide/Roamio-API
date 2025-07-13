import { PrismaClient } from '@prisma/client';

export class Repository {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async getUserWithVendorData(userId) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        gallery: {
          where: { type: 'VENDOR_GALLERY' }
        }
      }
    });
  }

  async updateVendorProfile(userId, data) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      include: { gallery: true }
    });
  }

  async updateLogo(userId, logoUrl) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { profile_picture_url: logoUrl }
    });
  }
}