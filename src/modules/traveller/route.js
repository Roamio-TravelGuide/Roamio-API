import { Router } from "express";
import { TravellerController } from "./controller.js";
import authenticate from "../../middleware/auth.js";

const router = Router();
const travellerController = new TravellerController();

router.get("/my-trips", authenticate, (req, res) => travellerController.getMyTrips(req, res));
router.get("/my-paid-trips", authenticate, (req, res) => travellerController.getMyPaidTrips(req, res));
router.get("/nearby-pois", (req, res) => travellerController.getNearbyPois(req, res));
router.get("/tour-package/:id", (req, res) => travellerController.getTourPackageById(req, res));

// Review routes
router.post("/reviews", authenticate, (req, res) => travellerController.createReview(req, res));
router.put("/reviews/:id", authenticate, (req, res) => travellerController.updateReview(req, res));
router.delete("/reviews/:id", authenticate, (req, res) => travellerController.deleteReview(req, res));
router.get("/reviews/:id", (req, res) => travellerController.getReviewById(req, res));
router.get("/reviews", authenticate, (req, res) => travellerController.getMyReviews(req, res));
router.get("/packages/:packageId/reviews", (req, res) => travellerController.getReviewsByPackage(req, res));
router.get("/packages/:packageId/rating-stats", (req, res) => travellerController.getPackageRatingStats(req, res));

export default router;