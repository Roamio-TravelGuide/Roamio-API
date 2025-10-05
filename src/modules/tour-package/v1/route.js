import { Router } from "express";
import multer from "multer";
import tourPackageController from "./controller.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

router.post(
  "/complete",
  upload.any(),
  tourPackageController.createCompleteTourPackage
);

router.get("/", tourPackageController.getTourPackages);

router.get("/statistics", tourPackageController.getTourPackageStatistics);

router.get("/:id", tourPackageController.getTourPackageById);

// New: return all media (cover + stop media) for a specific tour package
router.get("/:id/media", tourPackageController.getTourPackageMedia);

router.get("/guide/:guideId", tourPackageController.getTourPackagesByGuideId);

router.patch("/:id/status", tourPackageController.updateTourPackageStatus);

router.delete("/:id", tourPackageController.deleteTourPackage);

router.post("/:id/submit", tourPackageController.submitForApproval);

router.post('/:id/submit', tourPackageController.submitForApproval);

router.put('/:id', upload.any(), tourPackageController.updateTour);


export default router;
