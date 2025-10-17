import { Router } from "express";
import { TravellerController } from "./controller.js";
import authenticate from "../../middleware/auth.js";

const router = Router();
const travellerController = new TravellerController();

router.get("/my-trips", authenticate, (req, res) => travellerController.getMyTrips(req, res));
router.get("/my-paid-trips", authenticate, (req, res) => travellerController.getMyPaidTrips(req, res));
router.get("/nearby-pois", (req, res) => travellerController.getNearbyPois(req, res));
router.get("/tour-package/:id", (req, res) => travellerController.getTourPackageById(req, res));

export default router;