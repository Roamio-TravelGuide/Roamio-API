import prisma from '../../../database/connection';
import { 
  TourPackageFilters, 
  TourPackageResponse, 
  TourPackagesListResponse, 
  TourPackageStatistics,
  CreateTourPackageRequest,
  UpdateStatusRequest,

} from './interface';
import { tourPackageRepository } from './repository';

function convertPrice(price: unknown): number {
  if (typeof price === 'number') {
    return price;
  }
  if (typeof price === 'object' && price !== null && 'toNumber' in price) {
    return (price as { toNumber: () => number }).toNumber();
  }
  return 0;
}

export class TourPackageService {
  /**
   * Get tour packages with filters and pagination
   */
  async getTourPackages(filters: TourPackageFilters = {}): Promise<TourPackagesListResponse> {
    const {
      status,
      search,
      location,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10
    } = filters;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) {
        where.created_at.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.created_at.lte = new Date(dateTo);
      }
    }

    // Get total count
    const total = await prisma.tourPackage.count({ where });

    // Get paginated results
    const packages = await prisma.tourPackage.findMany({
      where,
      include: {
        guide: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Transform to match interface
    const transformedPackages: TourPackageResponse[] = packages.map(pkg => ({
      id: pkg.id,
      title: pkg.title,
      description: pkg.description ?? null,
      price: convertPrice(pkg.price),
      duration_minutes: pkg.duration_minutes,
      status: pkg.status,
      rejection_reason: pkg.rejection_reason ?? undefined,
      created_at: pkg.created_at.toISOString(),
      updated_at: pkg.updated_at?.toISOString() ?? new Date().toISOString(),
      guide_id: pkg.guide_id,
      guide: pkg.guide ? {
        user: pkg.guide.user,
        years_of_experience: pkg.guide.years_of_experience ?? 0,
        languages_spoken: pkg.guide.languages_spoken as string[]
      } : undefined
    }));

    return {
      packages: transformedPackages,
      total,
      page,
      limit
    };
  }

  /**
   * Get tour package by ID
   */
  async getTourPackageById(id: number): Promise<TourPackageResponse | null> {
  const tourPackage = await prisma.tourPackage.findUnique({
    where: { id },
    include: {
      guide: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      tour_stops: {
        orderBy: { sequence_no: 'asc' },
        include: {
          media: {
            include: {
              media: true
            }
          }
        }
      }
    }
  });

  if (!tourPackage) {
    return null;
  }

  return {
    id: tourPackage.id,
    title: tourPackage.title,
    description: tourPackage.description ?? null,
    price: convertPrice(tourPackage.price),
    duration_minutes: tourPackage.duration_minutes,
    status: tourPackage.status,
    rejection_reason: tourPackage.rejection_reason ?? undefined,
    created_at: tourPackage.created_at.toISOString(),
    updated_at: tourPackage.updated_at?.toISOString() ?? new Date().toISOString(),
    guide_id: tourPackage.guide_id,
    guide: tourPackage.guide ? {
      user: {
        id: tourPackage.guide.user.id,
        name: tourPackage.guide.user.name,
        email: tourPackage.guide.user.email
      },
      years_of_experience: tourPackage.guide.years_of_experience ?? 0,
      languages_spoken: tourPackage.guide.languages_spoken as string[]
    } : undefined,
    tour_stops: tourPackage.tour_stops.map((stop) => ({
      id: stop.id,
      sequence_no: stop.sequence_no,
      stop_name: stop.stop_name,
      description: stop.description ?? null,
      location_id: stop.location_id ?? null,
      media: stop.media.map((m) => ({
        id: m.media.id,
        url: m.media.url,
        duration_seconds: m.media.duration_seconds ?? undefined,
        media_type: m.media.media_type,
        uploaded_by_id: m.media.uploaded_by_id,
        file_size: m.media.file_size ? Number(m.media.file_size) : undefined,
        format: m.media.format ?? undefined
      }))
    }))
  };
}


  async createTourPackage(tourData: CreateTourPackageRequest): Promise<any> {
    try {
      return await tourPackageRepository.createTourPackage(tourData);
    } catch (error) {
      console.error('Error in createTourPackage service:', error);
      throw error;
    }
  }


  /**
   * Update tour package status
   */
  async updateTourPackageStatus(id: number, statusData: UpdateStatusRequest): Promise<TourPackageResponse | null> {
    const { status, rejection_reason } = statusData;
    
    try {
      const updatedPackage = await prisma.tourPackage.update({
        where: { id },
        data: {
          status,
          rejection_reason: rejection_reason || null,
          updated_at: new Date()
        },
        include: {
          guide: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      return {
        id: updatedPackage.id,
        title: updatedPackage.title,
        description: updatedPackage.description ?? null,
      price: convertPrice(updatedPackage.price),
        duration_minutes: updatedPackage.duration_minutes,
        status: updatedPackage.status,
        rejection_reason: updatedPackage.rejection_reason ?? undefined,
        created_at: updatedPackage.created_at.toISOString(),
        updated_at: updatedPackage.updated_at?.toISOString() ?? new Date().toISOString(),
        guide_id: updatedPackage.guide_id,
        guide: updatedPackage.guide ? {
          user: updatedPackage.guide.user,
          years_of_experience: updatedPackage.guide.years_of_experience ?? 0,
          languages_spoken: updatedPackage.guide.languages_spoken as string[]
        } : undefined
      };
    } catch (error: any) {
      if (error.code === 'P2025') { // Record not found
        return null;
      }
      throw error;
    }
  }

  /**
   * Get tour package statistics
   */
  async getTourPackageStatistics(): Promise<TourPackageStatistics> {
    const [pending, published, rejected, total] = await Promise.all([
      prisma.tourPackage.count({ where: { status: 'pending_approval' } }),
      prisma.tourPackage.count({ where: { status: 'published' } }),
      prisma.tourPackage.count({ where: { status: 'rejected' } }),
      prisma.tourPackage.count()
    ]);

    return {
      pending,
      published,
      rejected,
      total
    };
  }

  /**
   * Delete tour package
   */
  async deleteTourPackage(id: number): Promise<boolean> {
    try {
      await prisma.tourPackage.delete({
        where: { id }
      });
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') { // Record not found
        return false;
      }
      throw error;
    }
  }

  async getTourPackagesByGuideId(guideId: number){
    try {
      // console.log(guideId);
      if (!guideId || isNaN(guideId)) {
        throw new Error('Invalid guide ID');
      }

      return await tourPackageRepository.findByGuideId(guideId);
    } catch (error) {
      console.error('Error in getTourPackagesByGuideId service:', error);
      throw error;
    }
  }


}

export default new TourPackageService();