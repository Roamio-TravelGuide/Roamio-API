import { PackagesService } from "./service.js";

export class PackagesController {
    constructor() {
        this.packagesService = new PackagesService();
    }

    // Check payment status for a specific package and user
    async checkPaymentStatus(req, res) {
        try {
            const { packageId } = req.params;
            const { userId } = req.query;

            if (!packageId || !userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Package ID and User ID are required'
                });
            }

            const paymentStatus = await this.packagesService.checkPaymentStatus(
                parseInt(packageId),
                parseInt(userId)
            );

            res.json({
                success: true,
                data: paymentStatus
            });
        } catch (error) {
            console.error('Error in checkPaymentStatus:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get nearby packages by location
    async getNearbyPackages(req, res) {
        try {
            const { lat, lng, radius = 50, limit = 4 } = req.query;
            
            if (!lat || !lng) {
                return res.status(400).json({
                    success: false,
                    message: 'Latitude and longitude are required'
                });
            }

            const packages = await this.packagesService.getNearbyPackages(
                parseFloat(lat),
                parseFloat(lng),
                parseFloat(radius),
                parseInt(limit)
            );

            res.json({
                success: true,
                data: packages
            });
        } catch (error) {
            console.error('Error in getNearbyPackages:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get recent tours
    async getRecentTours(req, res) {
        try {
            const { limit = 3, days = 30 } = req.query;
            
            const packages = await this.packagesService.getRecentTours(
                parseInt(limit),
                parseInt(days)
            );

            res.json({
                success: true,
                data: packages
            });
        } catch (error) {
            console.error('Error in getRecentTours:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get trending tours
    async getTrendingTours(req, res) {
        try {
            const { limit = 4, period = 'week' } = req.query;
            
            const packages = await this.packagesService.getTrendingTours(
                parseInt(limit),
                period
            );

            res.json({
                success: true,
                data: packages
            });
        } catch (error) {
            console.error('Error in getTrendingTours:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get recommended tours
    async getRecommendedTours(req, res) {
        try {
            const { limit = 6, userId } = req.query;
            
            const packages = await this.packagesService.getRecommendedTours(
                parseInt(limit),
                userId
            );

            res.json({
                success: true,
                data: packages
            });
        } catch (error) {
            console.error('Error in getRecommendedTours:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}