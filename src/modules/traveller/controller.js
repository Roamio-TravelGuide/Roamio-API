import { TravellerService } from "./service.js";
import tourPackageService from "../tour-package/v1/service.js";
import { reviewValidation } from "./validate.js";

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

  // Review controller methods
  async createReview(req, res) {
    try {
      const { error, value } = reviewValidation.createReview.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          details: error.details[0].message
        });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: No user id"
        });
      }

      const review = await this.travellerService.createReview(userId, value);
      
      return res.status(201).json({
        success: true,
        message: "Review created successfully",
        data: review
      });
    } catch (error) {
      console.error("Create review error:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to create review"
      });
    }
  }

  async updateReview(req, res) {
    try {
      const { error, value } = reviewValidation.updateReview.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          details: error.details[0].message
        });
      }

      const reviewId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (!reviewId || isNaN(reviewId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid review ID"
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: No user id"
        });
      }

      const review = await this.travellerService.updateReview(reviewId, userId, value);
      
      return res.status(200).json({
        success: true,
        message: "Review updated successfully",
        data: review
      });
    } catch (error) {
      console.error("Update review error:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to update review"
      });
    }
  }

  async deleteReview(req, res) {
    try {
      const reviewId = parseInt(req.params.id);
      const userId = req.user?.id;

      if (!reviewId || isNaN(reviewId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid review ID"
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: No user id"
        });
      }

      await this.travellerService.deleteReview(reviewId, userId);
      
      return res.status(200).json({
        success: true,
        message: "Review deleted successfully"
      });
    } catch (error) {
      console.error("Delete review error:", error);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to delete review"
      });
    }
  }

  async getReviewsByPackage(req, res) {
    try {
      const { error, value } = reviewValidation.getReviews.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          details: error.details[0].message
        });
      }

      const packageId = parseInt(req.params.packageId);
      if (!packageId || isNaN(packageId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid package ID"
        });
      }

      const reviews = await this.travellerService.getReviewsByPackage(
        packageId,
        value.limit,
        value.offset
      );
      
      return res.status(200).json({
        success: true,
        message: "Reviews fetched successfully",
        data: reviews
      });
    } catch (error) {
      console.error("Get reviews by package error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch reviews"
      });
    }
  }

  async getMyReviews(req, res) {
    try {
      const { error, value } = reviewValidation.getReviews.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          details: error.details[0].message
        });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: No user id"
        });
      }

      const reviews = await this.travellerService.getMyReviews(
        userId,
        value.limit,
        value.offset
      );
      
      return res.status(200).json({
        success: true,
        message: "My reviews fetched successfully",
        data: reviews
      });
    } catch (error) {
      console.error("Get my reviews error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch reviews"
      });
    }
  }

  async getReviewById(req, res) {
    try {
      const reviewId = parseInt(req.params.id);
      if (!reviewId || isNaN(reviewId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid review ID"
        });
      }

      const review = await this.travellerService.getReviewById(reviewId);
      
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Review fetched successfully",
        data: review
      });
    } catch (error) {
      console.error("Get review by ID error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch review"
      });
    }
  }

  async getPackageRatingStats(req, res) {
    try {
      const packageId = parseInt(req.params.packageId);
      if (!packageId || isNaN(packageId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid package ID"
        });
      }

      const stats = await this.travellerService.getPackageRatingStats(packageId);
      
      return res.status(200).json({
        success: true,
        message: "Package rating stats fetched successfully",
        data: stats
      });
    } catch (error) {
      console.error("Get package rating stats error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch rating stats"
      });
    }
  }
}