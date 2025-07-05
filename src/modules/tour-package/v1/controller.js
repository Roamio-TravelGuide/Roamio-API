
import tourPackageService from './service.js';

class TourPackageController {
  async getTourPackages(req, res) {
    try {
      const filters = {
        status: req.query.status,
        search: req.query.search,
        location: req.query.location,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 10
      };

      const result = await tourPackageService.getTourPackages(filters);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching tour packages:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getTourPackageById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        res.status(400).json({
          success: false,
          message: 'Invalid tour package ID'
        });
        return;
      }

      const tourPackage = await tourPackageService.getTourPackageById(parseInt(id));
      
      if (!tourPackage) {
        res.status(404).json({
          success: false,
          message: 'Tour package not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: tourPackage
      });
    } catch (error) {
      console.error('Error fetching tour package:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async createTourPackage(req, res) {
    try {
      const packageData = req.body;
      const newPackage = await tourPackageService.createTourPackage(packageData);
      
      res.status(201).json({
        success: true,
        data: newPackage
      });
    } catch (error) {
      console.error("Error creating tour package:", error);
      const statusCode = error.statusCode || 500;
      const message = error.message || "Failed to create tour package";
      
      res.status(statusCode).json({ 
        success: false,
        error: message,
      });
    }
  }

  async updateTourPackageStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, rejection_reason } = req.body;

      if (!id || isNaN(parseInt(id))) {
        res.status(400).json({
          success: false,
          message: 'Invalid tour package ID'
        });
        return;
      }

      if (!status || !['published', 'rejected'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Status must be either "published" or "rejected"'
        });
        return;
      }

      if (status === 'rejected' && !rejection_reason) {
        res.status(400).json({
          success: false,
          message: 'Rejection reason is required when status is "rejected"'
        });
        return;
      }

      const statusData = {
        status,
        rejection_reason: status === 'rejected' ? rejection_reason : undefined
      };

      const updatedPackage = await tourPackageService.updateTourPackageStatus(parseInt(id), statusData);
      
      if (!updatedPackage) {
        res.status(404).json({
          success: false,
          message: 'Tour package not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Tour package status updated successfully',
        data: updatedPackage
      });
    } catch (error) {
      console.error('Error updating tour package status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getTourPackageStatistics(req, res) {
    try {
      const statistics = await tourPackageService.getTourPackageStatistics();
      
      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Error fetching tour package statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getTourPackagesByGuideId(req, res) {
    try {
      const { guideId } = req.params;      
      if (!guideId || isNaN(parseInt(guideId))) {
        res.status(400).json({
          success: false,
          message: 'Invalid guide ID'
        });
        return;
      }

      const tourPackages = await tourPackageService.getTourPackagesByGuideId(parseInt(guideId));

      // console.log(tourPackages);
      
      if (!tourPackages || tourPackages.length === 0) {
        res.status(404).json({
          success: false,
          message: 'No tour packages found for this guide'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: tourPackages
      });
    } catch (error) {
      console.error('Error fetching tour packages by guide:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export default new TourPackageController();
