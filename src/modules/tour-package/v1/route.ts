import { Router } from 'express';
import tourPackageController from './controller';

const router = Router();

router.get('/', tourPackageController.getTourPackages);

router.get('/statistics', tourPackageController.getTourPackageStatistics);

router.get('/:id', tourPackageController.getTourPackageById);

router.get('/guide/:guideId', tourPackageController.getTourPackagesByGuideId)

router.post('/createTour', tourPackageController.createTourPackage);

// PATCH /api/tour-packages/:id/status - Update tour package status
router.patch('/:id/status', tourPackageController.updateTourPackageStatus);
router.get('/:id/status', tourPackageController.updateTourPackageStatus);

// DELETE /api/tour-packages/:id - Delete tour package
// router.delete('/:id', tourPackageController.deleteTourPackage);

export default router;