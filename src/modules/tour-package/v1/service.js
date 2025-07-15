import prisma from '../../../database/connection.js';
import { tourPackageRepository } from './repository.js';
import { StorageService } from '../../storage/v1/service.js';

class TourPackageService {
  constructor() {
    this.storageService = new StorageService();
  }

  async getTourPackages(filters = {}) {
    const { status, search, location, dateFrom, dateTo, page = 1, limit = 10 } = filters;
    const where = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (location) where.location = { contains: location, mode: 'insensitive' };
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
                select: { id: true, name: true, email: true }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.tourPackage.count({ where })
    ]);

    return { packages, total, page, limit };
  }

  async getTourPackageById(id) {
    try {
      return await tourPackageRepository.findById(id);
    } catch (error) {
      console.error('Error in fetching service:', error);
      throw error;
    }
  }

  // Helper method to enrich tour data with fresh media URLs
  async enrichTourWithMediaUrls(tourPackage) {
    try {
      // Generate URL for cover image if it exists
      if (tourPackage.cover_image?.s3_key) {
        try {
          // Check if s3_key is valid
          if (tourPackage.cover_image.s3_key === 'undefined' || tourPackage.cover_image.s3_key === '') {
            console.warn(`Cover image ${tourPackage.cover_image.id} has invalid s3_key: "${tourPackage.cover_image.s3_key}"`);
            // Keep existing URL (might be external URL from seed data)
            tourPackage.cover_image_url = tourPackage.cover_image.url;
          } else {
            const coverImageUrl = await this.storageService.getFileUrl(tourPackage.cover_image.s3_key, 7200); // 2 hours
            tourPackage.cover_image.url = coverImageUrl;
            tourPackage.cover_image_url = coverImageUrl; // For backward compatibility
          }
        } catch (error) {
          console.error(`Failed to generate cover image URL: ${error.message}`);
          // Keep existing URL as fallback
          tourPackage.cover_image_url = tourPackage.cover_image.url;
        }
      }

      // Generate URLs for tour stop media
      if (tourPackage.tour_stops) {
        await Promise.all(
          tourPackage.tour_stops.map(async (stop) => {
            if (stop.media && stop.media.length > 0) {
              await Promise.all(
                stop.media.map(async (stopMedia) => {
                  if (stopMedia.media?.s3_key) {
                    try {
                      // Check if s3_key is valid
                      if (stopMedia.media.s3_key === 'undefined' || stopMedia.media.s3_key === '') {
                        console.warn(`Media ${stopMedia.media.id} has invalid s3_key: "${stopMedia.media.s3_key}"`);
                        // Keep existing URL (might be external URL from seed data)
                        // No need to update as we'll keep the existing URL
                      } else {
                        const mediaUrl = await this.storageService.getFileUrl(stopMedia.media.s3_key, 7200); // 2 hours
                        stopMedia.media.url = mediaUrl;
                      }
                    } catch (error) {
                      console.error(`Failed to generate media URL for ${stopMedia.media.id}: ${error.message}`);
                      // Keep existing URL as fallback
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
      return tourPackage; // Return original data if URL generation fails
    }
  }

  async createTourPackage(tourData) {
    try {
      return await tourPackageRepository.create(tourData);
    } catch (error) {
      console.error('Error in createTourPackage service:', error);
      throw error;
    }
  }

  async updateTourPackageStatus(id, statusData) {
    try {
      return await tourPackageRepository.updateStatus(id, statusData.status, statusData.rejection_reason);
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }

  async getTourPackageStatistics() {
    return tourPackageRepository.getStatistics();
  }

  async getTourPackagesByGuideId(guideId , filters = {}) {
    try {
      if (!guideId || isNaN(guideId)) {
        throw new Error('Invalid guide ID');
      }

      // console.log(guideId);

      const result = await tourPackageRepository.findByGuideId(guideId, filters);

      return {
        packages: result.packages,
        total: result.total,
        page: filters.page || 1,
        limit: filters.limit || 10
      };
    } catch (error) {
      console.error('Error in getTourPackagesByGuideId service:', error);
      throw error;
    }
  }


  async updateTourPackage(id, updateData) {
    try {
      // Check if package exists
      const existingPackage = await this.getTourPackageById(id);
      if (!existingPackage) {
        return null;
      }

      // Update the package using repository
      const updatedPackage = await tourPackageRepository.updateTourPackage(id, updateData);
      
      // Enrich with fresh media URLs if needed
      return await this.enrichTourWithMediaUrls(updatedPackage);
    } catch (error) {
      console.error('Error updating tour package:', error);
      throw error;
    }
  }
};

export default new TourPackageService();