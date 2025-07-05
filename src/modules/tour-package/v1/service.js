import prisma from '../../../database/connection.js';
import { tourPackageRepository } from './repository.js';

class TourPackageService {
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

  async getTourPackagesByGuideId(guideId) {
    try {
      if (!guideId || isNaN(guideId)) throw new Error('Invalid guide ID');
      return await tourPackageRepository.findByGuideId(guideId);
    } catch (error) {
      console.error('Error in getTourPackagesByGuideId service:', error);
      throw error;
    }
  }
}

export default new TourPackageService();