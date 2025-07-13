import { PrismaClient } from '@prisma/client';

export class VendorRepository {
    constructor() {
        this.prisma = new PrismaClient();
    }

    async getVendorByUserId(userId) {
        return this.prisma.vendor.findUnique({
            where: { user_id: userId },
            include: {
                user: {
                    select: {
                        email: true,
                        phone_no: true,
                        name: true
                    }
                },
                logo: true,
                cover_image: true
            }
        });
    }

    async updateVendorProfile(userId, data) {
        return this.prisma.vendor.update({
            where: { user_id: userId },
            data
        });
    }

    async updateUserProfile(userId, data) {
        return this.prisma.user.update({
            where: { id: userId },
            data
        });
    }

    async createMedia(data) {
        return this.prisma.media.create({
            data
        });
    }
}