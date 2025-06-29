import { Router } from 'express';
import tourPackageController from './controller';

const router = Router();

// GET /api/tour-packages - Get all tour packages with filters
router.get('/', tourPackageController.getTourPackages);

// GET /api/tour-packages/statistics - Get tour package statistics
router.get('/statistics', tourPackageController.getTourPackageStatistics);

// GET /api/tour-packages/:id - Get tour package by ID
router.get('/:id', tourPackageController.getTourPackageById);

// POST /api/tour-packages - Create new tour package
// router.post('/', tourPackageController.createTourPackage);

// PATCH /api/tour-packages/:id/status - Update tour package status
router.patch('/:id/status', tourPackageController.updateTourPackageStatus);

// DELETE /api/tour-packages/:id - Delete tour package
// router.delete('/:id', tourPackageController.deleteTourPackage);

export default router;