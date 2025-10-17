import { PrismaClient } from "@prisma/client";
import { TravellerRepository } from "./repository.js";

const prisma = new PrismaClient();

export class TravellerService {
  constructor() {
    this.travellerRepository = new TravellerRepository();
  }

  async getMyTrips(travelerId) {
    return await this.travellerRepository.getPackagesForTraveler(travelerId);
  }

  async getMyPaidTrips(travelerId) {
    return await this.travellerRepository.getPaidPackagesForTraveler(travelerId);
  }

  async findNearbyPois() {
    // Show all POIs without any conditions
    const query = `
      SELECT
        poi.*,
        l.latitude,
        l.longitude,
        l.address,
        l.city,
        l.district,
        l.province
      FROM "poi" poi
      JOIN "location" l ON poi.location_id = l.id
      ORDER BY poi.name ASC
      LIMIT 50
    `;

    const result = await prisma.$queryRawUnsafe(query);

    return result;
  }
}