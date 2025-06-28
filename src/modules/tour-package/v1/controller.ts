import { Request, Response } from 'express';
import tourPackageService from './service';
import { TourPackageFilters, CreateTourPackageRequest, UpdateStatusRequest } from './interface';

export class TourPackageController {
  /**
   * Get all tour packages with filters
   */
  async getTourPackages(req: Request, res: Response): Promise<void> {
    try {
      const filters: TourPackageFilters = {
        status: req.query.status as any,
        search: req.query.search as string,
        location: req.query.location as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof TourPackageFilters] === undefined) {
          delete filters[key as keyof TourPackageFilters];
        }
      });

      const result = await tourPackageService.getTourPackages(filters);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Error fetching tour packages:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get tour package by ID
   */
  async getTourPackageById(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      console.error('Error fetching tour package:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Create new tour package
   */
  // async createTourPackage(req: Request, res: Response): Promise<void> {
  //   try {
  //     const { title, description, price, duration_minutes, guide_id }: CreateTourPackageRequest = req.body;

  //     // Validation
  //     if (!title || !description || !price || !duration_minutes || !guide_id) {
  //       res.status(400).json({
  //         success: false,
  //         message: 'Missing required fields: title, description, price, duration_minutes, guide_id'
  //       });
  //       return;
  //     }

  //     if (price <= 0) {
  //       res.status(400).json({
  //         success: false,
  //         message: 'Price must be greater than 0'
  //       });
  //       return;
  //     }

  //     if (duration_minutes <= 0) {
  //       res.status(400).json({
  //         success: false,
  //         message: 'Duration must be greater than 0 minutes'
  //       });
  //       return;
  //     }

  //     const packageData: CreateTourPackageRequest = {
  //       title: title.trim(),
  //       description: description.trim(),
  //       price: parseFloat(price.toString()),
  //       duration_minutes: parseInt(duration_minutes.toString()),
  //       guide_id: parseInt(guide_id.toString())
  //     };

  //     const newPackage = await tourPackageService.createTourPackage(packageData);
      
  //     res.status(201).json({
  //       success: true,
  //       message: 'Tour package created successfully',
  //       data: newPackage
  //     });
  //   } catch (error: any) {
  //     console.error('Error creating tour package:', error);
      
  //     // Handle specific database errors
  //     if (error.code === '23503') { // Foreign key violation
  //       res.status(400).json({
  //         success: false,
  //         message: 'Invalid guide_id provided'
  //       });
  //       return;
  //     }

  //     res.status(500).json({
  //       success: false,
  //       message: 'Internal server error',
  //       error: process.env.NODE_ENV === 'development' ? error.message : undefined
  //     });
  //   }
  // }

  /**
   * Update tour package status
   */
  async updateTourPackageStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, rejection_reason }: UpdateStatusRequest = req.body;

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

      const statusData: UpdateStatusRequest = {
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
    } catch (error: any) {
      console.error('Error updating tour package status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get tour package statistics
   */
  async getTourPackageStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await tourPackageService.getTourPackageStatistics();
      
      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error: any) {
      console.error('Error fetching tour package statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Delete tour package
   */
  // async deleteTourPackage(req: Request, res: Response): Promise<void> {
  //   try {
  //     const { id } = req.params;
      
  //     if (!id || isNaN(parseInt(id))) {
  //       res.status(400).json({
  //         success: false,
  //         message: 'Invalid tour package ID'
  //       });
  //       return;
  //     }

  //     const deleted = await tourPackageService.deleteTourPackage(parseInt(id));
      
  //     if (!deleted) {
  //       res.status(404).json({
  //         success: false,
  //         message: 'Tour package not found'
  //       });
  //       return;
  //     }

  //     res.status(200).json({
  //       success: true,
  //       message: 'Tour package deleted successfully'
  //     });
  //   } catch (error: any) {
  //     console.error('Error deleting tour package:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: 'Internal server error',
  //       error: process.env.NODE_ENV === 'development' ? error.message : undefined
  //     });
  //   }
  // }
}

export default new TourPackageController();