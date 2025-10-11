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

  async findNearby(latitude, longitude, radiusKm = 200, category = null) {
    // Using raw SQL for distance calculation since Prisma doesn't support geospatial queries natively
    let whereClause = `
      WHERE poi.status = 'approved'
      AND (
        6371 * acos(
          cos(radians($1)) * cos(radians(l.latitude)) * cos(radians(l.longitude) - radians($2)) +
          sin(radians($1)) * sin(radians(l.latitude))
        )
      ) <= $3
    `;

    const params = [latitude, longitude, radiusKm];

    if (category) {
      whereClause += ` AND poi.category = $${params.length + 1}`;
      params.push(category);
    }

    const query = `
      SELECT
        poi.*,
        l.latitude,
        l.longitude,
        l.address,
        l.city,
        l.district,
        l.province,
        (
          6371 * acos(
            cos(radians($1)) * cos(radians(l.latitude)) * cos(radians(l.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(l.latitude))
          )
        ) as distance_km
      FROM "poi" poi
      JOIN "location" l ON poi.location_id = l.id
      ${whereClause}
      ORDER BY distance_km ASC
      LIMIT 20
    `;

    const result = await prisma.$queryRawUnsafe(query, ...params);

    return result;
  }
}
