import prisma from "../../../database/connection.js";
import { tourPackageRepository } from "./repository.js";
import { StorageService } from "../../storage/v1/service.js";

class TourPackageService {
  constructor() {
    this.storageService = new StorageService();
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

  // async getTourPackages(filters = {}) {
  //   const {
  //     status,
  //     search,
  //     location,
  //     dateFrom,
  //     dateTo,
  //     page = 1,
  //     limit = 10,
  //   } = filters;
  //   const where = {};

  //   if (status) where.status = status;
  //   if (search) {
  //     where.OR = [
  //       { title: { contains: search, mode: "insensitive" } },
  //       { description: { contains: search, mode: "insensitive" } },
  //     ];
  //   }
  //   if (location) where.location = { contains: location, mode: "insensitive" };
  //   if (dateFrom || dateTo) {
  //     where.created_at = {};
  //     if (dateFrom) where.created_at.gte = new Date(dateFrom);
  //     if (dateTo) where.created_at.lte = new Date(dateTo);
  //   }

  //   const [packages, total] = await Promise.all([
  //     prisma.tourPackage.findMany({
  //       where,
  //       include: {
  //         guide: {
  //           include: {
  //             user: {
  //               select: { id: true, name: true, email: true },
  //             },
  //           },
  //         },
  //       },
  //       orderBy: { created_at: "desc" },
  //       skip: (page - 1) * limit,
  //       take: limit,
  //     }),
  //     prisma.tourPackage.count({ where }),
  //   ]);

  //   return { packages, total, page, limit };
  // }

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

  async createTourPackage(tourData) {
    try {
      return await tourPackageRepository.create(tourData);
    } catch (error) {
      console.error('Error in createTourPackage:', error);
      throw error;
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
}

export default new TourPackageService();
