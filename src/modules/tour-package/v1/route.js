import { Router } from 'express';
import multer from 'multer';
import tourPackageController from './controller.js';

const router = Router();
const upload = multer();

router.get('/', tourPackageController.getTourPackages);
router.get('/statistics', tourPackageController.getTourPackageStatistics);
router.get('/:id', tourPackageController.getTourPackageById);
router.get('/guide/:guideId', tourPackageController.getTourPackagesByGuideId);
router.post('/createTour', tourPackageController.createTourPackage);
router.patch('/:id/status', tourPackageController.updateTourPackageStatus);

router.post('/tour-stops/bulk',tourPackageController.createTourStops)
router.post('/locations', tourPackageController.createLocation)

router.delete('/:id' , tourPackageController.deleteTourPackage)

router.post('/:id/submit', tourPackageController.submitForApproval);

router.put('/:id', tourPackageController.updateTour);


export default router;