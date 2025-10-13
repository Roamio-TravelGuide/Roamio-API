import { PackagesRepository } from './repository.js';

export class PackagesService {
    constructor() {
        this.packagesRepository = new PackagesRepository();
    }

    // Get nearby packages by location
    async getNearbyPackages(latitude, longitude, radiusKm = 50, limit = 4) {
        return await this.packagesRepository.findNearbyPackages(
            latitude,
            longitude,
            radiusKm,
            limit
        );
    }

    // Get recent tours
    async getRecentTours(limit = 3, days = 30) {
        return await this.packagesRepository.findRecentTours(limit, days);
    }

    // Get trending tours
    async getTrendingTours(limit = 4, period = 'week') {
        return await this.packagesRepository.findTrendingTours(limit, period);
    }

    // Get recommended tours
    async getRecommendedTours(limit = 6, userId = null) {
        return await this.packagesRepository.findRecommendedTours(limit, userId);
    }
}