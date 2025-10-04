import { Router } from "express";
import PoiController from "./controller.js";

const router = Router();
const poiController = new PoiController();

// Get POI by ID
router.get("/:id", (req, res) => poiController.getPoiById(req, res));

// Get POIs by vendor ID
router.get("/vendor/:vendorId", (req, res) =>
  poiController.getPoisByVendorId(req, res)
);

// DEV: Get all POIs (with locations) - debug endpoint
router.get("/all", (req, res) => poiController.getAllPois(req, res));

export default router;
