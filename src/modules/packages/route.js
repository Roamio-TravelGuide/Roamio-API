import { Router } from 'express';
import { PackagesController } from './controller.js';

const router = Router();
const packagesController = new PackagesController();

// Nearby packages by location
router.get('/nearby', packagesController.getNearbyPackages.bind(packagesController));

// Recent tours
router.get('/recent', packagesController.getRecentTours.bind(packagesController));

// Trending tours
router.get('/trending', packagesController.getTrendingTours.bind(packagesController));

// Recommended tours
router.get('/recommended', packagesController.getRecommendedTours.bind(packagesController));

export default router;