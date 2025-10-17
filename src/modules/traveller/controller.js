import { TravellerService } from "./service.js";
import tourPackageService from "../tour-package/v1/service.js";

export class TravellerController {
  constructor() {
    this.travellerService = new TravellerService();
  }

  async getMyTrips(req, res) {
    try {
      console.log('getMyTrips called');
      console.log('req.user:', req.user);
      const travelerId = req.user?.id;
      if (!travelerId) {
        console.error('No travelerId found on req.user');
        return res.status(401).json({ error: 'Unauthorized: No user id' });
      }
      const packages = await this.travellerService.getMyTrips(travelerId);
      console.log('Packages found:', packages);
      res.status(200).json({ data: packages, message: "My trips fetched successfully" });
    } catch (error) {
      console.error("getMyTrips error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch trips" });
    }
  }

  async getMyPaidTrips(req, res) {
    try {
      console.log('getMyPaidTrips called');
      console.log('req.user:', req.user);
      const travelerId = req.user?.id;
      if (!travelerId) {
        console.error('No travelerId found on req.user');
        return res.status(401).json({ error: 'Unauthorized: No user id' });
      }
      const packages = await this.travellerService.getMyPaidTrips(travelerId);
      console.log('Paid packages found:', packages);
      res.status(200).json({ data: packages, message: "My paid trips fetched successfully" });
    } catch (error) {
      console.error("getMyPaidTrips error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch paid trips" });
    }
  }

  async getNearbyPois(req, res) {
    try {
      const pois = await this.travellerService.findNearbyPois();
      return res.status(200).json({ success: true, data: pois });
    } catch (err) {
      console.error("Get nearby POIs error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  async getTourPackageById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: "Invalid tour package ID",
        });
      }

      const tourPackage = await tourPackageService.getTourPackageById(parseInt(id));

      if (!tourPackage) {
        return res.status(404).json({
          success: false,
          message: "Tour package not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: tourPackage,
      });
    } catch (error) {
      console.error("Error fetching tour package:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}