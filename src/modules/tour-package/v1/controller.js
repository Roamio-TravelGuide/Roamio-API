import tourPackageService from "./service.js";
import { PrismaClient } from "@prisma/client";
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
        limit: req.query.limit ? parseInt(req.query.limit) : 100000000000,
        disablePagination: req.query.disablePagination === "true",
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
      // console.log(req.params);
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

  async getTourPackageMedia(req, res) {
    try {
      const { id } = req.params;
      if (!id || isNaN(parseInt(id))) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid tour package ID" });
      }

      const tourPackage = await tourPackageService.getTourPackageById(
        parseInt(id)
      );
      if (!tourPackage) {
        return res
          .status(404)
          .json({ success: false, message: "Tour package not found" });
      }

      // Build media response
      const cover = tourPackage.cover_image || null;
      const stops = (tourPackage.tour_stops || []).map((stop) => ({
        id: stop.id,
        sequence_no: stop.sequence_no,
        stop_name: stop.stop_name,
        media: (stop.media || []).map((m) => ({ ...(m.media || m) })),
      }));

      return res
        .status(200)
        .json({
          success: true,
          data: { cover_image: cover, tour_stops: stops },
        });
    } catch (error) {
      console.error("Error fetching tour package media:", error);
      return res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  async updateTour(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      // console.log(updateData);

      // if (updateData.tour_stops && updateData.tour_stops[0]) {
      //   const firstStop = updateData.tour_stops[0];

      //   // Check if first stop has media
      //   if (firstStop.media && firstStop.media.length > 0) {
      //     console.log(`Media for Stop 1 (${firstStop.stop_name}):`);

      //     firstStop.media.forEach((media, index) => {
      //       console.log(`  Media ${index + 1}:`);
      //       console.log(`    Type: ${media.media_type}`);
      //       console.log(`    URL: ${media.url}`);
      //       console.log(`    S3 Key: ${media.s3_key}`);
      //       console.log(`    Duration: ${media.duration_seconds || 'N/A'} seconds`);
      //       console.log('    -------------------');
      //     });
      //   } else {
      //     console.log('First stop has no media');
      //   }
      // } else {
      //   console.log('Tour has no stops');
      // }

      if (!id || !updateData) {
        return res
          .status(400)
          .json({ error: "Tour ID and update data are required" });
      }

      const updatedTour = await tourPackageService.updateTour(id, updateData);
      res.status(200).json(updatedTour);
    } catch (error) {
      console.error("Error updating tour:", error);
      res.status(500).json({ error: error.message || "Failed to update tour" });
    }
  }

  async submitForApproval(req, res) {
    try {
      const { id } = req.params;

      // console.log(id);

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: "Invalid tour package ID",
        });
      }

      if (req.body.tour) {
        await tourPackageService.updateTourPackage(parseInt(id), req.body);
      }

      const submittedPackage = await tourPackageService.updateTourPackageStatus(
        parseInt(id),
        { status: "pending_approval" }
      );

      return res.status(200).json({
        success: true,
        data: submittedPackage,
      });
    } catch (error) {
      console.error("Error submitting tour:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async deleteTourPackage(req, res) {
    try {
      const { id } = req.params;
      console.log(id);

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: "Invalid tour package ID",
        });
      }

      const deleteTour = await tourPackageService.deleteTourPackage(
        parseInt(id)
      );
    } catch (error) {
      console.error("Error Deleting tour package:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async createCompleteTourPackage(req, res) {
    try {
      console.log("=== TOUR CREATION REQUEST STARTED ===");

      // Log ALL request data
      console.log("=== REQUEST HEADERS ===");
      console.log("Content-Type:", req.headers["content-type"]);
      console.log("Content-Length:", req.headers["content-length"]);

      console.log("=== REQUEST BODY (RAW) ===");
      console.log("Body keys:", Object.keys(req.body));
      console.log("Full body:", req.body);

      console.log("=== REQUEST FILES (RAW) ===");
      console.log("Files count:", req.files?.length || 0);
      console.log("All files:", req.files);

      const files = req.files;
      const body = req.body;

      // Log each field in body in detail
      console.log("=== DETAILED BODY ANALYSIS ===");
      Object.keys(body).forEach((key) => {
        console.log(`Field: ${key}`);
        console.log(`  Type: ${typeof body[key]}`);
        console.log(`  Length: ${body[key]?.length || "N/A"}`);

        // Try to parse JSON fields
        if (typeof body[key] === "string") {
          try {
            const parsed = JSON.parse(body[key]);
            console.log(`  Parsed JSON:`, parsed);
          } catch (e) {
            console.log(
              `  String value: ${body[key].substring(0, 100)}${
                body[key].length > 100 ? "..." : ""
              }`
            );
          }
        } else {
          console.log(`  Value:`, body[key]);
        }
        console.log("  ---");
      });

      // Log each file in detail
      console.log("=== DETAILED FILES ANALYSIS ===");
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          console.log(`File ${index}:`);
          console.log(`  Fieldname: ${file.fieldname}`);
          console.log(`  Originalname: ${file.originalname}`);
          console.log(`  Mimetype: ${file.mimetype}`);
          console.log(`  Size: ${file.size} bytes`);
          console.log(`  Buffer length: ${file.buffer?.length || "N/A"}`);
          console.log("  ---");
        });
      } else {
        console.log("No files found in request");
      }

      // 1. Validate required data
      if (!req.body.tour) {
        console.log("ERROR: Tour data is missing from request");
        return res.status(400).json({
          success: false,
          message: "Tour data is required",
        });
      }

      let tourData;
      if (body.tour) {
        console.log("Parsing tour data from body.tour...");
        tourData =
          typeof body.tour === "string" ? JSON.parse(body.tour) : body.tour;
        console.log("Parsed tourData:", tourData);
      } else {
        console.log(
          "Tour data not found in body.tour, trying flat structure..."
        );
        tourData = {
          title: body.title,
          description: body.description,
          price: body.price,
          duration_minutes: body.duration_minutes,
          status: body.status || "pending_approval",
          guide_id: body.guide_id,
        };
        console.log("Extracted tourData from flat structure:", tourData);
      }

      // Parse stops data - FIXED VERSION
      let stops = [];
      console.log("=== PARSING STOPS DATA ===");

      if (body.stops && Array.isArray(body.stops)) {
        console.log("Found stops as array:", body.stops);

        // ✅ FIX: Parse each stop in the array
        stops = body.stops
          .map((stopString, index) => {
            try {
              if (typeof stopString === "string") {
                const parsedStop = JSON.parse(stopString);
                console.log(`Parsed stop ${index}:`, parsedStop);
                return parsedStop;
              } else {
                console.log(`Stop ${index} is already an object:`, stopString);
                return stopString;
              }
            } catch (e) {
              console.log(`Error parsing stop ${index}:`, e.message);
              console.log("Raw stop string:", stopString);
              return null;
            }
          })
          .filter((stop) => stop !== null);

        console.log("Final parsed stops:", stops);
      } else if (body.stops && typeof body.stops === "string") {
        console.log("Found stops as string, parsing JSON...");
        try {
          stops = JSON.parse(body.stops);
          console.log("Parsed stops from body.stops:", stops);
        } catch (e) {
          console.log("Error parsing stops string:", e.message);
        }
      } else {
        console.log(
          "Stops not found in body.stops, checking for indexed stops..."
        );
        const stopKeys = Object.keys(body).filter((key) =>
          key.startsWith("stops[")
        );
        console.log("Found stop keys:", stopKeys);

        if (stopKeys.length > 0) {
          stops = stopKeys
            .map((key) => {
              try {
                const stopData =
                  typeof body[key] === "string"
                    ? JSON.parse(body[key])
                    : body[key];
                console.log(`Parsed ${key}:`, stopData);
                return stopData;
              } catch (e) {
                console.log(`Error parsing ${key}:`, e.message);
                return null;
              }
            })
            .filter((stop) => stop !== null);

          console.log("Final parsed stops from indexed format:", stops);
        } else {
          console.log("No stops found in indexed format either");
          stops = parseStopsFromBody(body);
          console.log("Stops from parseStopsFromBody:", stops);
        }
      }

      console.log("=== ANALYZING MEDIA FILES ===");
      const coverImageFile = files.find(
        (file) => file.fieldname === "cover_image"
      );
      console.log(
        "Cover image file:",
        coverImageFile
          ? {
              fieldname: coverImageFile.fieldname,
              originalname: coverImageFile.originalname,
              size: coverImageFile.size,
            }
          : "Not found"
      );

      console.log("All media files before organization:");
      const mediaFiles = files.filter(
        (file) => file.fieldname !== "cover_image"
      );
      console.log("Media files count:", mediaFiles.length);
      mediaFiles.forEach((file) => {
        console.log(
          `  - ${file.fieldname}: ${file.originalname} (${file.size} bytes)`
        );
      });

      const stopMediaFiles = organizeStopMediaFiles(files);
      console.log("Organized stop media files:", stopMediaFiles);

      console.log("=== FINAL DATA READY FOR PROCESSING ===");
      console.log("Tour data:", tourData);
      console.log("Stops count:", stops.length);

      // ✅ NOW THIS SHOULD WORK PROPERLY
      stops.forEach((stop, index) => {
        console.log(`Stop ${index}:`, {
          stop_name: stop.stop_name,
          sequence_no: stop.sequence_no,
          media_count: stop.media?.length || 0,
          media: stop.media?.map((m) => ({
            media_type: m.media_type,
            duration_seconds: m.duration_seconds,
            file_name: m.file_name,
          })),
        });
      });

      console.log("Cover image:", coverImageFile ? "Present" : "Missing");
      console.log("Stop media files:", stopMediaFiles);

      const result = await tourPackageService.createCompleteTourPackage({
        tourData,
        stops,
        coverImageFile,
        stopMediaFiles,
      });

      // For now, just return the parsed data
      res.status(201).json({
        success: true,
        message: "Tour package parsed successfully - check server logs",
        data: {
          tourData,
          stopsCount: stops.length,
          stops: stops, // Include parsed stops in response for debugging
          coverImage: !!coverImageFile,
          mediaFilesCount: Object.keys(stopMediaFiles).length,
          receivedFiles: files?.length || 0,
        },
      });
    } catch (error) {
      console.error("Error creating tour package:", error);
      console.error("Error stack:", error.stack);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

function parseStopsFromBody(body) {
  const stops = [];

  // If stops is already an array (from your log, it is)
  if (Array.isArray(body.stops)) {
    // Parse each stop string in the array
    body.stops.forEach((stopString) => {
      if (typeof stopString === "string") {
        try {
          const stop = JSON.parse(stopString);
          stops.push(stop);
        } catch (parseError) {
          console.error("Error parsing stop JSON:", parseError);
        }
      } else if (typeof stopString === "object") {
        // If it's already an object, use it directly
        stops.push(stopString);
      }
    });
  } else {
    // Fallback to the original flat structure parsing (keep this as backup)
    let index = 0;
    while (true) {
      const stopKey = `stops[${index}]`;
      const stopData = body[stopKey];

      if (!stopData) break;

      let stop;
      if (typeof stopData === "string") {
        stop = JSON.parse(stopData);
      } else {
        // Extract from flat structure
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

  files.forEach((file) => {
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
