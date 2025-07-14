
import tourPackageService from './service.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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
        return res.status(400).json({
          success: false,
          message: 'Invalid tour package ID'
        });
      }

      const tourPackage = await tourPackageService.getTourPackageById(parseInt(id));

      if (!tourPackage) {
        return res.status(404).json({
          success: false,
          message: 'Tour package not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: tourPackage
      });
      
    } catch (error) {
      console.error('Error fetching tour package:', error);
      return res.status(500).json({
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
      const { title, description, price, duration_minutes, guide_id, stops = [] } = req.body;

      const guide = await prisma.travelGuide.findUnique({
        where: { 
          user_id: parseInt(guide_id) 
        },
        select: { 
          id: true 
        }
      });


      if (!title || !guide.id) {
        return res.status(400).json({ error: 'Title and guide_id are required' });
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Create the base tour package
        const tourPackage = await tx.tourPackage.create({
          data: {
            title,
            description: description || '',
            price: price || 0,
            duration_minutes: duration_minutes || 0,
            guide_id: parseInt(guide.id),
            status: 'pending_approval'
          }
        });

        // 2. Process locations and stops
        const createdStops = await Promise.all(
          stops.map(async (stop, index) => {
            let locationId = null;
            
            // Create location if coordinates exist
            if (stop.location) {
              const location = await tx.location.create({
                data: {
                  longitude: stop.location.longitude,
                  latitude: stop.location.latitude,
                  address: stop.location.address || '',
                  city: stop.location.city || '',
                  province: stop.location.province || '',
                  district: stop.location.district || '',
                  postal_code: stop.location.postal_code || ''
                }
              });
              locationId = location.id;
            }

            // Create the tour stop
            return await tx.tourStop.create({
              data: {
                package_id: tourPackage.id,
                sequence_no: index + 1, // 1-based index
                stop_name: stop.stop_name || `Stop ${index + 1}`,
                description: stop.description || '',
                location_id: locationId
              }
            });
          })
        );

        return {
          tourPackage,
          stops: createdStops
        };
      });

      res.status(201).json({
        success: true,
        data: result.tourPackage,
        stops: result.stops
      });

    } catch (error) {
      console.error('Tour creation failed:', error);
      res.status(500).json({ 
        error: error.message,
        details: error.stack 
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
      // console.log(req.params);
      const { guideId } = req.params;
      const { status, search, page = 1, limit = 10 } = req.query;
      
      if (!guideId || isNaN(parseInt(guideId))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid guide ID'
        });
      }

      const filters = {
        status,
        search,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await tourPackageService.getTourPackagesByGuideId(parseInt(guideId), filters);

      res.status(200).json({
        success: true,
        data: result.packages,
        total: result.total,
        page: result.page,
        limit: result.limit
      });
    } catch (error) {
      console.error('Error fetching tour packages by guide:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  } 

  async createLocation(req, res) {
    try {
      const { longitude, latitude, address, city, province, district, postal_code } = req.body;
      
      const newLocation = await prisma.location.create({
        data: {
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude),
          address,
          city,
          province,
          district,
          postal_code
        }
      });

      res.status(201).json(newLocation);
    } catch (error) {
      console.error('Location creation failed:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // In your controller, consider using transactions for atomic operations
  async createTourStops(req, res) {
    try {
      const { package_id, stops } = req.body;

      if (!package_id || !stops?.length) {
        return res.status(400).json({ error: 'Package ID and stops are required' });
      }

      const createdStops = await prisma.$transaction(async (tx) => {
        // Create stops
        const stopsCreated = await Promise.all(
          stops.map(stop => 
            tx.tourStop.create({
              data: {
                package_id: parseInt(package_id),
                sequence_no: stop.sequence_no,
                stop_name: stop.stop_name,
                description: stop.description || '',
                location_id: stop.location_id || null
              }
            })
          )
        );

        // Create locations if needed
        await Promise.all(
          stops.map(async (stop) => {
            if (stop.location && !stop.location_id) {
              const location = await tx.location.create({
                data: {
                  longitude: parseFloat(stop.location.longitude),
                  latitude: parseFloat(stop.location.latitude),
                  address: stop.location.address || '',
                  city: stop.location.city || '',
                  province: stop.location.province || '',
                  district: stop.location.district || '',
                  postal_code: stop.location.postal_code || ''
                }
              });
              await tx.tourStop.update({
                where: { id: stop.id },
                data: { location_id: location.id }
              });
            }
          })
        );

        return stopsCreated;
      });

      res.status(201).json(createdStops);
    } catch (error) {
      console.error('Error creating tour stops:', error);
      res.status(500).json({ error: error.message });
    }
  }  
}

export default new TourPackageController();
