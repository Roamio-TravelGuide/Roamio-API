import prisma from "../../../database/connection.js";
import { tourPackageRepository } from "./repository.js";
import { StorageService } from "../../storage/v1/service.js";
// import { storeFile, generateFileName } from '../utils/fileStorage.js';
import LocalFileStorage from '../../../utils/fileStorage.js';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TourPackageService {
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
          // Include the cover image with full details
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
              sample_rate: true
            }
          },
          // Include tour stops with their media
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
                      sample_rate: true
                    }
                  }
                }
              }
            },
            orderBy: { sequence_no: 'asc' }
          },
          // Include aggregate data
          _count: {
            select: {
              downloads: true,
              reviews: true
            }
          }
        },
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tourPackage.count({ where }),
    ]);

    // If you need average rating, fetch it separately
    const packageIds = packages.map(pkg => pkg.id);
    const averageRatings = await prisma.review.groupBy({
      by: ['package_id'],
      where: {
        package_id: { in: packageIds }
      },
      _avg: {
        rating: true
      }
    });

    // Create a map for quick lookup
    const ratingMap = {};
    averageRatings.forEach(rating => {
      ratingMap[rating.package_id] = rating._avg.rating || 0;
    });

    // Add the stats to each package and transform the media structure
    const packagesWithStats = packages.map(pkg => ({
      ...pkg,
      downloadCount: pkg._count.downloads,
      reviewCount: pkg._count.reviews,
      averageRating: ratingMap[pkg.id] || 0,
      // Transform tour stops to include media directly
      tour_stops: pkg.tour_stops.map(stop => ({
        ...stop,
        // Extract media from the join table structure
        media: stop.media.map(tsm => tsm.media)
      }))
    }));

    return { 
      packages: packagesWithStats, 
      total, 
      page, 
      limit 
    };
  }

  async getTourPackageById(id) {
    try {
      const tourPackage = await tourPackageRepository.findById(id);
      if (!tourPackage) return null;
      
      return await this.enrichTourWithMediaUrls(tourPackage);
    } catch (error) {
      console.error('Error in getTourPackageById:', error);
      throw error;
    }
  }

  async enrichTourWithMediaUrls(tourPackage) {
    try {
      if (tourPackage.cover_image?.s3_key) {
        try {
          if (tourPackage.cover_image.s3_key === 'undefined' || tourPackage.cover_image.s3_key === '') {
            console.warn(`Cover image ${tourPackage.cover_image.id} has invalid s3_key`);
            tourPackage.cover_image_url = tourPackage.cover_image.url;
          } else {
            const coverImageUrl = await this.storageService.getFileUrl(tourPackage.cover_image.s3_key, 7200);
            tourPackage.cover_image.url = coverImageUrl;
            tourPackage.cover_image_url = coverImageUrl;
          }
        } catch (error) {
          console.error(`Failed to generate cover image URL: ${error.message}`);
          tourPackage.cover_image_url = tourPackage.cover_image.url;
        }
      }

      if (tourPackage.tour_stops) {
        await Promise.all(
          tourPackage.tour_stops.map(async (stop) => {
            if (stop.media && stop.media.length > 0) {
              await Promise.all(
                stop.media.map(async (stopMedia) => {
                  if (stopMedia.media?.s3_key) {
                    try {
                      if (stopMedia.media.s3_key === 'undefined' || stopMedia.media.s3_key === '') {
                        console.warn(`Media ${stopMedia.media.id} has invalid s3_key`);
                      } else {
                        const mediaUrl = await this.storageService.getFileUrl(stopMedia.media.s3_key, 7200);
                        stopMedia.media.url = mediaUrl;
                      }
                    } catch (error) {
                      console.error(`Failed to generate media URL for ${stopMedia.media.id}: ${error.message}`);
                    }
                  }
                })
              );
            }
          })
        );
      }

      return tourPackage;
    } catch (error) {
      console.error('Error enriching tour with media URLs:', error);
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
      console.error('Error in getTourPackagesByGuideId:', error);
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
      console.error('Error deleting tour package:', error);
      throw error;
    }
  }

   async updateTour(id, updateData) {
    try {
      if (!updateData.title || !updateData.description) {
        throw new Error('Title and description are required');
      }
      
      if (updateData.price <= 0) {
        throw new Error('Price must be greater than 0');
      }
      
      if (updateData.duration_minutes <= 0) {
        throw new Error('Duration must be greater than 0');
      }

      const currentTour = await prisma.tourPackage.findUnique({
        where: { id: parseInt(id) },
        select: { status: true }
      });

      if (!currentTour) {
        throw new Error('Tour package not found');
      }

      if (currentTour.status === 'rejected') {
        updateData.status = 'pending_approval';
        updateData.rejection_reason = null;
      }

      const updatedTour = await tourPackageRepository.updateTour(id, updateData);
      
      return updatedTour;
    } catch (error) {
      console.error('Error in tour service:', error);
      throw error;
    }
  }
  
  async createCompleteTourPackage({tourData, stops, coverImageFile, stopMediaFiles}){
    try {
      let coverImageUrl = null;
      let coverMediaId = null;

      const initialTour = await tourPackageRepository.createInitialTourPackage(tourData);
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
          media_type: 'image',
          uploaded_by_id: tourData.guide_id,
          file_size: coverImageFile.size,
          format: path.extname(coverImageFile.originalname).replace('.', ''),
          width: null,
          height: null,
          duration_seconds: null, // Images don't have duration
        });
        
        coverImageUrl = coverResult.url;
        coverMediaId = mediaRecord.id;
      }

      if (coverMediaId) {
        await tourPackageRepository.updateTourCover(tourId, coverMediaId);
      }

      const stopMediaUrls = {};

      // ✅ FIX: Use the stops array to get media metadata
      for (let stopIndex = 0; stopIndex < stops.length; stopIndex++) {
        const stop = stops[stopIndex];
        stopMediaUrls[stopIndex] = [];
        
        // Check if this stop has media files to upload
        const files = stopMediaFiles[stopIndex] || [];
        
        // Also check if stop has media metadata
        const stopMediaMetadata = stop.media || [];
        
        for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
          const file = files[fileIndex];
          const mediaMetadata = stopMediaMetadata[fileIndex] || {};
          
          const resourceType = file.mimetype.startsWith('audio/') ? 'audio' : 
                              file.mimetype.startsWith('video/') ? 'video' : 'image';
          
          // Upload stop media to local storage
          const mediaResult = await LocalFileStorage.storeStopMedia(
            tourId,
            stopIndex,
            resourceType,
            file.buffer,
            file.originalname
          );
          
          // ✅ FIX: Use duration from metadata if available
          const duration = mediaMetadata.duration_seconds || null;
          
          // ✅ FIX: Create media record with duration
          const mediaRecord = await tourPackageRepository.createMedia({
            url: mediaResult.url,
            media_type: resourceType,
            uploaded_by_id: tourData.guide_id,
            file_size: file.size,
            format: path.extname(file.originalname).replace('.', ''),
            duration_seconds: duration, // ✅ NOW INCLUDES DURATION
            width: null,
            height: null,
            bitrate: null,
            sample_rate: null,
          });
          
          stopMediaUrls[stopIndex].push({
            url: mediaResult.url,
            type: resourceType,
            duration: duration,
            media_id: mediaRecord.id
          });
        }
      }

      const result = await tourPackageRepository.createTourStopsWithMedia({
        tourId,
        stops,
        stopMediaUrls
      });

      const completeTour = await tourPackageRepository.getTourPackageById(tourId);

      return completeTour;

    } catch (error) {
      if (tourId) {
        await LocalFileStorage.deleteTourFiles(tourId);
      }
      throw new Error(`Failed to create tour package: ${error.message}`);
    }
  }
}

export default new TourPackageService();

