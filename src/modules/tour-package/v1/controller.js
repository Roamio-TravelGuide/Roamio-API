import tourPackageService from "./service.js";


function parseTourRequestData(req) {
  const files = req.files;
  const body = req.body;

  if (!req.body.tour) {
    throw new Error('Tour data is required');
  }

  let tourData;
  if (body.tour) {
    tourData = typeof body.tour === 'string' ? JSON.parse(body.tour) : body.tour;
  } else {
    tourData = {
      title: body.title,
      description: body.description,
      price: body.price,
      duration_minutes: body.duration_minutes,
      status: body.status || 'pending_approval',
      guide_id: body.guide_id
    };
  }

  let stops = [];
  if (body.stops && Array.isArray(body.stops)) {
    stops = body.stops.map((stopString, index) => {
      try {
        return typeof stopString === 'string' ? JSON.parse(stopString) : stopString;
      } catch (e) {
        console.error(`Error parsing stop ${index}:`, e.message);
        return null;
      }
    }).filter(stop => stop !== null);
  } else if (body.stops && typeof body.stops === 'string') {
    try {
      stops = JSON.parse(body.stops);
    } catch (e) {
      console.error('Error parsing stops string:', e.message);
    }
  } else {
    stops = parseStopsFromBody(body);
  }

  const coverImageFile = files?.find(file => file.fieldname === 'cover_image');
  const stopMediaFiles = organizeStopMediaFiles(files || []);

  return { tourData, stops, coverImageFile, stopMediaFiles };
}


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
        limit: req.query.limit ? parseInt(req.query.limit) : 100000000000,
        disablePagination: req.query.disablePagination === 'true'
      };

      const result = await tourPackageService.getTourPackages(filters);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching tour packages:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
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

      const tourPackage = await tourPackageService.getTourPackageById(
        parseInt(id)
      );

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

  async updateTourPackageStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, rejection_reason } = req.body;

      if (!id || isNaN(parseInt(id))) {
        res.status(400).json({
          success: false,
          message: "Invalid tour package ID",
        });
        return;
      }

      if (!status || !["published", "rejected"].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Status must be either "published" or "rejected"',
        });
        return;
      }

      if (status === "rejected" && !rejection_reason) {
        res.status(400).json({
          success: false,
          message: 'Rejection reason is required when status is "rejected"',
        });
        return;
      }

      const statusData = {
        status,
        rejection_reason: status === "rejected" ? rejection_reason : undefined,
      };

      const updatedPackage = await tourPackageService.updateTourPackageStatus(
        parseInt(id),
        statusData
      );

      if (!updatedPackage) {
        res.status(404).json({
          success: false,
          message: "Tour package not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Tour package status updated successfully",
        data: updatedPackage,
      });
    } catch (error) {
      console.error("Error updating tour package status:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getTourPackageStatistics(req, res) {
    try {
      const statistics = await tourPackageService.getTourPackageStatistics();

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      console.error("Error fetching tour package statistics:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getTourPackagesByGuideId(req, res) {
    try {
      const { guideId } = req.params;
      const { status, search, page = 1, limit = 10 } = req.query;

      if (!guideId || isNaN(parseInt(guideId))) {
        return res.status(400).json({
          success: false,
          message: "Invalid guide ID",
        });
      }

      const filters = {
        status,
        search,
        page: parseInt(page),
        limit: parseInt(limit),
      };

      const result = await tourPackageService.getTourPackagesByGuideId(
        parseInt(guideId),
        filters
      );

      res.status(200).json({
        success: true,
        data: result.packages,
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (error) {
      console.error("Error fetching tour packages by guide:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async submitForApproval(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid tour package ID'
        });
      }

      if (req.body.tour) {
        await tourPackageService.updateTourPackage(parseInt(id), req.body);
      }

      const submittedPackage = await tourPackageService.updateTourPackageStatus(
        parseInt(id),
        { status: 'pending_approval' }
      );

      return res.status(200).json({
        success: true,
        data: submittedPackage
      });
    } catch (error) {
      console.error('Error submitting tour:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  async deleteTourPackage(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: "Invalid tour package ID",
        });
      }

      const deleteTour = await tourPackageService.deleteTourPackage(parseInt(id));

      return res.status(200).json({
        success: true,
        message: 'Tour package deleted successfully'
      });

    } catch (error) {
      console.error('Error Deleting tour package:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  async createCompleteTourPackage(req, res) {
    try {
      const { tourData, stops, coverImageFile, stopMediaFiles } = parseTourRequestData(req);

      const result = await tourPackageService.createCompleteTourPackage({
        tourData,
        stops,
        coverImageFile,
        stopMediaFiles,
      });

      res.status(201).json({
        success: true,
        message: 'Tour package created successfully',
        data: result
      });
    } catch (error) {
      console.error('Error creating tour package:', error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async updateTour(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid tour package ID'
        });
      }

      const { tourData, stops, coverImageFile, stopMediaFiles } = parseTourRequestData(req);

      const updatedTour = await tourPackageService.updateTourPackage({
        tourId: parseInt(id),
        tourData,
        stops,
        coverImageFile,
        stopMediaFiles
      });

      return res.status(200).json({
        success: true,
        message: 'Tour package updated successfully',
        data: updatedTour
      });
    } catch (error) {
      console.error('Error updating tour package:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

function parseStopsFromBody(body) {
  const stops = [];

  if (Array.isArray(body.stops)) {
    body.stops.forEach(stopString => {
      if (typeof stopString === 'string') {
        try {
          const stop = JSON.parse(stopString);
          stops.push(stop);
        } catch (parseError) {
          console.error("Error parsing stop JSON:", parseError);
        }
      } else if (typeof stopString === 'object') {
        stops.push(stopString);
      }
    });
  } else {
    let index = 0;
    while (true) {
      const stopKey = `stops[${index}]`;
      const stopData = body[stopKey];

      if (!stopData) break;

      let stop;
      if (typeof stopData === "string") {
        stop = JSON.parse(stopData);
      } else {
        stop = {
          sequence_no: body[`stops[${index}][sequence_no]`],
          stop_name: body[`stops[${index}][stop_name]`],
          description: body[`stops[${index}][description]`] || "",
          location: {
            longitude: parseFloat(body[`stops[${index}][location][longitude]`]),
            latitude: parseFloat(body[`stops[${index}][location][latitude]`]),
            address: body[`stops[${index}][location][address]`],
            city: body[`stops[${index}][location][city]`],
            province: body[`stops[${index}][location][province]`],
            district: body[`stops[${index}][location][district]`] || "",
            postal_code: body[`stops[${index}][location][postal_code]`] || "",
          },
        };
      }

      stops.push(stop);
      index++;
    }
  }

  return stops;
}

function organizeStopMediaFiles(files) {
  const stopMediaFiles = {};

  files.forEach(file => {
    const match = file.fieldname.match(/stop_(\d+)_media/);
    if (match) {
      const stopIndex = parseInt(match[1]);
      if (!stopMediaFiles[stopIndex]) {
        stopMediaFiles[stopIndex] = [];
      }
      stopMediaFiles[stopIndex].push(file);
    }
  });

  return stopMediaFiles;
}

export default new TourPackageController();