import prisma from "../../../database/connection.js";
import { tourPackageRepository } from "./repository.js";
import LocalFileStorage from "../../../utils/fileStorage.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TourPackageService {
  constructor() {
    // Local storage utility already returns public URLs stored in media.url
    this.localStorage = LocalFileStorage;
  }
  async getTourPackages(filters = {}) {
    const {
      status,
      search,
      location,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = filters;
    const where = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (location) where.location = { contains: location, mode: "insensitive" };
    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) where.created_at.gte = new Date(dateFrom);
      if (dateTo) where.created_at.lte = new Date(dateTo);
    }

    const [packages, total] = await Promise.all([
      prisma.tourPackage.findMany({
        where,
        include: {
          guide: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          cover_image: {
            select: {
              id: true,
              url: true,
              media_type: true,
              duration_seconds: true,
              file_size: true,
              format: true,
              bitrate: true,
              height: true,
              width: true,
              sample_rate: true,
            },
          },
          tour_stops: {
            include: {
              location: true,
              media: {
                include: {
                  media: {
                    select: {
                      id: true,
                      url: true,
                      media_type: true,
                      duration_seconds: true,
                      file_size: true,
                      format: true,
                      bitrate: true,
                      height: true,
                      width: true,
                      sample_rate: true,
                    },
                  },
                },
              },
            },
            orderBy: { sequence_no: "asc" },
          },
          _count: {
            select: {
              downloads: true,
              reviews: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tourPackage.count({ where }),
    ]);

    const packageIds = packages.map((pkg) => pkg.id);
    const averageRatings = await prisma.review.groupBy({
      by: ["package_id"],
      where: {
        package_id: { in: packageIds },
      },
      _avg: {
        rating: true,
      },
    });

    const ratingMap = {};
    averageRatings.forEach((rating) => {
      ratingMap[rating.package_id] = rating._avg.rating || 0;
    });

    const packagesWithStats = packages.map((pkg) => ({
      ...pkg,
      downloadCount: pkg._count.downloads,
      reviewCount: pkg._count.reviews,
      averageRating: ratingMap[pkg.id] || 0,
      tour_stops: pkg.tour_stops.map((stop) => ({
        ...stop,
        media: stop.media.map((tsm) => tsm.media),
      })),
    }));

    return {
      packages: packagesWithStats,
      total,
      page,
      limit,
    };
  }

  async getTourPackageById(id) {
    try {
      const tourPackage = await tourPackageRepository.findById(id);
      if (!tourPackage) return null;

      return await this.enrichTourWithMediaUrls(tourPackage);
    } catch (error) {
      console.error("Error in getTourPackageById:", error);
      throw error;
    }
  }

  async enrichTourWithMediaUrls(tourPackage) {
    try {
      // LocalFileStorage and repository already store `url` pointing to `/uploads/...`.
      if (tourPackage.cover_image) {
        tourPackage.cover_image_url = tourPackage.cover_image.url;
      }

      if (tourPackage.tour_stops) {
        tourPackage.tour_stops = tourPackage.tour_stops.map((stop) => ({
          ...stop,
          media: stop.media.map((m) => m.media || m),
        }));
      }

      return tourPackage;
    } catch (error) {
      console.error("Error enriching tour with media URLs:", error);
      return tourPackage;
    }
  }

  async updateTourPackageStatus(id, statusData) {
    try {
      return await tourPackageRepository.updateStatus(
        id,
        statusData.status,
        statusData.rejection_reason
      );
    } catch (error) {
      if (error.code === "P2025") return null;
      throw error;
    }
  }

  async getTourPackageStatistics() {
    return tourPackageRepository.getStatistics();
  }

  async getTourPackagesByGuideId(guideId, filters = {}) {
    try {
      if (!guideId || isNaN(guideId)) {
        throw new Error("Invalid guide ID");
      }

      const result = await tourPackageRepository.findByGuideId(
        guideId,
        filters
      );

      return {
        packages: result.packages,
        total: result.total,
        page: filters.page || 1,
        limit: filters.limit || 10000,
      };
    } catch (error) {
      console.error("Error in getTourPackagesByGuideId:", error);
      throw error;
    }
  }

  async deleteTourPackage(id) {
    try {
      const existingPackage = await this.getTourPackageById(id);
      if (!existingPackage) {
        return null;
      }

      return await tourPackageRepository.deleteTourPackage(id);
    } catch (error) {
      console.error("Error deleting tour package:", error);
      throw error;
    }
  }

  async updateTour(id, updateData) {
    try {
      if (!updateData.title || !updateData.description) {
        throw new Error("Title and description are required");
      }

      if (updateData.price <= 0) {
        throw new Error("Price must be greater than 0");
      }

      if (updateData.duration_minutes <= 0) {
        throw new Error("Duration must be greater than 0");
      }

      const currentTour = await prisma.tourPackage.findUnique({
        where: { id: parseInt(id) },
        select: { status: true },
      });

      if (!currentTour) {
        throw new Error("Tour package not found");
      }

      if (currentTour.status === "rejected") {
        updateData.status = "pending_approval";
        updateData.rejection_reason = null;
      }

      const updatedTour = await tourPackageRepository.updateTour(
        id,
        updateData
      );

      return updatedTour;
    } catch (error) {
      console.error("Error in tour service:", error);
      throw error;
    }
  }

  async createCompleteTourPackage({
    tourData,
    stops,
    coverImageFile,
    stopMediaFiles,
  }) {
    try {
      let coverMediaId = null;

      const initialTour = await tourPackageRepository.createInitialTourPackage(
        tourData
      );
      let tourId = initialTour.id;

      // Handle cover image
      if (coverImageFile) {
        const coverResult = await LocalFileStorage.storeTourCover(
          tourId,
          coverImageFile.buffer,
          coverImageFile.originalname
        );

        const mediaRecord = await tourPackageRepository.createMedia({
          url: coverResult.url,
          media_type: "image",
          uploaded_by_id: tourData.guide_id,
          file_size: coverImageFile.size,
          format: path.extname(coverImageFile.originalname).replace(".", ""),
          width: null,
          height: null,
          duration_seconds: null,
        });

        coverMediaId = mediaRecord.id;
      }

      if (coverMediaId) {
        await tourPackageRepository.updateTourCover(tourId, coverMediaId);
      }

      const stopMediaUrls = {};

      for (let stopIndex = 0; stopIndex < stops.length; stopIndex++) {
        const stop = stops[stopIndex];
        stopMediaUrls[stopIndex] = [];

        const files = stopMediaFiles[stopIndex] || [];
        const stopMediaMetadata = stop.media || [];

        for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
          const file = files[fileIndex];
          const mediaMetadata = stopMediaMetadata[fileIndex] || {};

          const resourceType = file.mimetype.startsWith("audio/")
            ? "audio"
            : file.mimetype.startsWith("video/")
            ? "video"
            : "image";

          const mediaResult = await LocalFileStorage.storeStopMedia(
            tourId,
            stopIndex,
            resourceType,
            file.buffer,
            file.originalname
          );

          const duration = mediaMetadata.duration_seconds || null;

          const mediaRecord = await tourPackageRepository.createMedia({
            url: mediaResult.url,
            media_type: resourceType,
            uploaded_by_id: tourData.guide_id,
            file_size: file.size,
            format: path.extname(file.originalname).replace(".", ""),
            duration_seconds: duration,
            width: null,
            height: null,
            bitrate: null,
            sample_rate: null,
          });

          stopMediaUrls[stopIndex].push({
            url: mediaResult.url,
            type: resourceType,
            duration: duration,
            media_id: mediaRecord.id,
          });
        }
      }

      const result = await tourPackageRepository.createTourStopsWithMedia({
        tourId,
        stops,
        stopMediaUrls,
      });

      const completeTour = await tourPackageRepository.getTourPackageById(
        tourId
      );

      return completeTour;
    } catch (error) {
      if (tourId) {
        await LocalFileStorage.deleteTourFiles(tourId);
      }
      throw new Error(`Failed to create tour package: ${error.message}`);
    }
  }

  async updateTourPackage({
    tourId,
    tourData,
    stops,
    coverImageFile,
    stopMediaFiles,
  }) {
    try {
      // Get existing tour to verify it exists
      const existingTour = await tourPackageRepository.getTourPackageById(
        tourId
      );
      if (!existingTour) {
        throw new Error("Tour package not found");
      }

      let coverMediaId = existingTour.cover_image_id;

      // Handle cover image update - only if new file provided
      if (coverImageFile) {
        // Delete old cover image file if exists
        if (existingTour.cover_image?.url) {
          await LocalFileStorage.deleteFile(existingTour.cover_image.url);
        }

        // Upload new cover image to tour folder
        const coverResult = await LocalFileStorage.storeTourCover(
          tourId,
          coverImageFile.buffer,
          coverImageFile.originalname
        );

        // Create new media record
        const mediaRecord = await tourPackageRepository.createMedia({
          url: coverResult.url,
          media_type: "image",
          uploaded_by_id: tourData.guide_id || existingTour.guide_id,
          file_size: coverImageFile.size,
          format: path.extname(coverImageFile.originalname).replace(".", ""),
          width: null,
          height: null,
          duration_seconds: null,
        });

        coverMediaId = mediaRecord.id;
      }

      // Process stop media files
      const stopMediaUrls = {};

      if (stops && stops.length > 0) {
        // Get existing stops to handle media cleanup
        const existingStops = existingTour.tour_stops || [];

        for (let stopIndex = 0; stopIndex < stops.length; stopIndex++) {
          const stop = stops[stopIndex];
          stopMediaUrls[stopIndex] = [];

          const existingStop = existingStops.find((s) => s.id === stop.id);

          // Handle new media files for this stop
          const files = stopMediaFiles[stopIndex] || [];
          const stopMediaMetadata = stop.media || [];

          // If existing stop and new files provided, delete old media files
          console.log(existingStop);
          if (existingStop && files.length > 0) {
            for (const existingMedia of existingStop.media) {
              await LocalFileStorage.deleteFile(existingMedia.url);
            }
          }

          // Upload new media files
          for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
            const file = files[fileIndex];
            const mediaMetadata = stopMediaMetadata[fileIndex] || {};

            const resourceType = file.mimetype.startsWith("audio/")
              ? "audio"
              : file.mimetype.startsWith("video/")
              ? "video"
              : "image";

            const mediaResult = await LocalFileStorage.storeStopMedia(
              tourId,
              stopIndex,
              resourceType,
              file.buffer,
              file.originalname
            );

            const duration = mediaMetadata.duration_seconds || null;

            const mediaRecord = await tourPackageRepository.createMedia({
              url: mediaResult.url,
              media_type: resourceType,
              uploaded_by_id: tourData.guide_id || existingTour.guide_id,
              file_size: file.size,
              format: path.extname(file.originalname).replace(".", ""),
              duration_seconds: duration,
              width: null,
              height: null,
              bitrate: null,
              sample_rate: null,
            });

            stopMediaUrls[stopIndex].push({
              url: mediaResult.url,
              type: resourceType,
              duration: duration,
              media_id: mediaRecord.id,
            });
          }
        }

        // Handle deleted stops - delete their files
        const updatedStopIds = stops.map((s) => s.id).filter((id) => id);
        const stopsToDelete = existingStops.filter(
          (s) => !updatedStopIds.includes(s.id)
        );

        for (const stopToDelete of stopsToDelete) {
          for (const media of stopToDelete.media) {
            await LocalFileStorage.deleteFile(media.media.url);
          }
        }
      }

      // Update cover image if changed
      if (coverMediaId !== existingTour.cover_image_id) {
        await tourPackageRepository.updateTourCover(tourId, coverMediaId);
      }

      // Update tour package with stops using repository
      const updatedTour =
        await tourPackageRepository.updateTourPackageWithStops(
          tourId,
          {
            ...tourData,
            status: "pending_approval",
            rejection_reason: null,
          },
          stops,
          stopMediaUrls
        );

      return updatedTour;
    } catch (error) {
      console.error("Error updating tour package:", error);
      throw new Error(`Failed to update tour package: ${error.message}`);
    }
  }
}

export default new TourPackageService();
