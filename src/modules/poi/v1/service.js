import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class PoiService {
  async findById(id) {
    return prisma.pOI.findUnique({
      where: { id },
      include: { location: true },
    });
  }

  async findByVendorId(vendorId) {
    return prisma.pOI.findMany({
      where: { vendor_id: vendorId },
      include: { location: true },
    });
  }

  async findAll() {
    return prisma.pOI.findMany({
      include: { location: true },
    });
  }
}
