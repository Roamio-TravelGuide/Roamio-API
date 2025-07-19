import { Router } from "express";
import tourPackageController from "./controller.js";

const router = Router();
router.get("/revenue", tourPackageController.getRevenue);
router.get("/", tourPackageController.getTourPackages);
router.get("/statistics", tourPackageController.getTourPackageStatistics);
router.get("/:id", tourPackageController.getTourPackageById);
router.get("/guide/:guideId", tourPackageController.getTourPackagesByGuideId);
router.post("/createTour", tourPackageController.createTourPackage);
router.patch("/:id/status", tourPackageController.updateTourPackageStatus);

router.post("/tour-stops/bulk", tourPackageController.createTourStops);
router.post("/locations", tourPackageController.createLocation);

router.put("/edit/:id", tourPackageController.updateTourPackage);

export default router;
