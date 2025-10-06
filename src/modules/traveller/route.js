import { Router } from "express";
import { TravellerController } from "./controller.js";
import authenticate from "../../middleware/auth.js";

const router = Router();
const travellerController = new TravellerController();

router.get("/my-trips", authenticate, (req, res) => travellerController.getMyTrips(req, res));

export default router;