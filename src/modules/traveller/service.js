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

  // Review services
  async createReview(userId, reviewData) {
    // First, get the traveler record for this user
    const traveler = await prisma.traveler.findUnique({
      where: { user_id: userId }
    });

    if (!traveler) {
      throw new Error('Traveler profile not found');
    }

    const completeReviewData = {
      ...reviewData,
      traveler_id: traveler.id,
      user_id: userId
    };

    return await this.travellerRepository.createReview(completeReviewData);
  }

  async updateReview(reviewId, userId, updateData) {
    return await this.travellerRepository.updateReview(reviewId, userId, updateData);
  }

  async deleteReview(reviewId, userId) {
    return await this.travellerRepository.deleteReview(reviewId, userId);
  }

  async getReviewsByPackage(packageId, limit, offset) {
    return await this.travellerRepository.getReviewsByPackage(packageId, limit, offset);
  }

  async getMyReviews(userId, limit, offset) {
    return await this.travellerRepository.getReviewsByUser(userId, limit, offset);
  }

  async getReviewById(reviewId) {
    return await this.travellerRepository.getReviewById(reviewId);
  }

  async getPackageRatingStats(packageId) {
    return await this.travellerRepository.getPackageRatingStats(packageId);
  }

  async findNearbyPlaces(latitude, longitude, radius = 10) {
    return await this.travellerRepository.findNearbyPlaces(latitude, longitude, radius);
  }
}