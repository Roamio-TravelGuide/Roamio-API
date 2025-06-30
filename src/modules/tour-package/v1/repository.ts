import { Prisma, PrismaClient, MediaType, PackageStatus , TourPackage } from '@prisma/client';
import {
  TourPackageFilters,
  TourPackageResponse,
  TourPackageStatistics,
  MediaItem,
  TourStopResponse,
  CreateTourPackageRequest
} from './interface';

const prisma = new PrismaClient();

export class TourPackageRepository {
  async findMany(filters: TourPackageFilters) {
    const {
      status,
      search,
      location,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status as PackageStatus;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          guide: {
            user: {
              name: { contains: search, mode: 'insensitive' }
            }
          }
        }
      ];
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

    const [packages, total] = await Promise.all([
      prisma.tourPackage.findMany({
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
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.tourPackage.count({ where })
    ]);

    return {
      packages: packages.map(this.mapToResponse),
      total,
      page,
      limit
    };
  }

  async findById(id: number): Promise<TourPackageResponse | null> {
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

    return tourPackage ? this.mapToResponse(tourPackage) : null;
  }

  async updateStatus(
    id: number,
    status: 'published' | 'rejected',
    rejectionReason?: string
  ): Promise<TourPackageResponse> {
    const updateData: any = {
      status: status as PackageStatus,
      updated_at: new Date()
    };

    if (status === 'rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    } else if (status === 'published') {
      updateData.rejection_reason = null;
    }

    const updatedPackage = await prisma.tourPackage.update({
      where: { id },
      data: updateData,
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

    return this.mapToResponse(updatedPackage);
  }

  async getStatistics(): Promise<TourPackageStatistics> {
    const [pending, published, rejected, total] = await Promise.all([
      prisma.tourPackage.count({ where: { status: PackageStatus.pending_approval } }),
      prisma.tourPackage.count({ where: { status: PackageStatus.published } }),
      prisma.tourPackage.count({ where: { status: PackageStatus.rejected } }),
      prisma.tourPackage.count()
    ]);

    return {
      pending,
      published,
      rejected,
      total
    };
  }

  async create(data: {
    title: string;
    description: string;
    price: number;
    duration_minutes: number;
    guide_id: number;
  }): Promise<TourPackageResponse> {
    const tourPackage = await prisma.tourPackage.create({
      data: {
        ...data,
        status: PackageStatus.pending_approval
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

    return this.mapToResponse(tourPackage);
  }
  

  async delete(id: number): Promise<void> {
    await prisma.tourPackage.delete({
      where: { id }
    });
  }

  private mapToResponse(tourPackage: any): TourPackageResponse {
    return {
      id: tourPackage.id,
      title: tourPackage.title,
      description: tourPackage.description,
      price: tourPackage.price,
      duration_minutes: tourPackage.duration_minutes,
      status: tourPackage.status,
      rejection_reason: tourPackage.rejection_reason ?? undefined,
      created_at: tourPackage.created_at.toISOString(),
      updated_at: tourPackage.updated_at?.toISOString() ?? new Date().toISOString(),
      guide_id: tourPackage.guide_id,
      guide: tourPackage.guide
        ? {
            user: {
              id: tourPackage.guide.user.id,
              name: tourPackage.guide.user.name,
              email: tourPackage.guide.user.email
            },
            years_of_experience: tourPackage.guide.years_of_experience ?? 0,
            languages_spoken: tourPackage.guide.languages_spoken as string[]
          }
        : undefined,
      tour_stops: tourPackage.tour_stops?.map((stop: any): TourStopResponse => ({
        id: stop.id,
        sequence_no: stop.sequence_no,
        stop_name: stop.stop_name,
        description: stop.description ?? null,
        location_id: stop.location_id ?? null,
        media: stop.media.map((m: any): MediaItem => ({
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

  async getTourPackageById(id: number): Promise<any | null> {
    return prisma.tourPackage.findUnique({
      where: { id },
      include: {
        guide: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profile_picture_url: true,
                bio: true
              }
            }
          }
        },
        cover_image: true,
        tour_stops: {
          include: {
            location: true,
            media: {
              include: {
                media: true
              }
            }
          },
          orderBy: { sequence_no: 'asc' }
        },
        reviews: {
          include: {
            traveler: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profile_picture_url: true
                  }
                }
              }
            }
          },
          orderBy: { date: 'desc' }
        }
      }
    });
  }

  async createTourPackage(tourData: CreateTourPackageRequest): Promise<any> {
  return await prisma.$transaction(async (tx) => {
    // 1. Verify the TravelGuide exists using user_id
    const guide = await tx.travelGuide.findFirst({
      where: { user_id: tourData.guide_id },
      select: { id: true }
    });

    if (!guide) {
      throw new Error(
        `User ${tourData.guide_id} doesn't have a TravelGuide profile. ` +
        `Please create a guide profile first.`
      );
    }

    // 2. Create the tour package using proper relation connections
    const packageData: Prisma.TourPackageCreateInput = {
      title: tourData.title,
      description: tourData.description || undefined,
      price: tourData.price,
      duration_minutes: tourData.duration_minutes,
      status: PackageStatus.pending_approval,
      guide: { connect: { id: guide.id } }, // Connect to TravelGuide.id
      cover_image: tourData.cover_image_url ? {
        create: {
          url: tourData.cover_image_url,
          media_type: MediaType.image,
          uploader: { connect: { id: tourData.guide_id } } // Connect to User.id
        }
      } : undefined,
      tour_stops: {
        create: tourData.tour_stops.map(stop => ({
          sequence_no: stop.sequence_no,
          stop_name: stop.stop_name,
          description: stop.description || undefined,
          location: stop.location ? {
            create: {
              longitude: stop.location.longitude,
              latitude: stop.location.latitude,
              address: stop.location.address || undefined,
              city: stop.location.city || undefined,
              province: stop.location.province || undefined,
              district: stop.location.district || undefined,
              postal_code: stop.location.postal_code || undefined
            }
          } : undefined,
          media: {
            create: stop.media?.map(mediaItem => ({
              media: {
                create: {
                  url: mediaItem.url,
                  media_type: mediaItem.media_type as MediaType,
                  uploader: { connect: { id: tourData.guide_id } },
                  duration_seconds: mediaItem.duration_seconds,
                  format: mediaItem.url.split('.').pop()
                }
              }
            })) || []
          }
        }))
      }
    };

    // 3. Create the complete tour package with all relations
    const createdPackage = await tx.tourPackage.create({
      data: packageData,
      include: {
        tour_stops: {
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

    return this.getTourPackageById(createdPackage.id);
  });
}

async findByGuideId(guideId: number): Promise<TourPackage[]> {
  try {
    return await prisma.tourPackage.findMany({
      where: { 
        guide_id: guideId,
        status: 'published'
      },
      include: {
        guide: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profile_picture_url: true
              }
            }
          }
        },
        cover_image: true,
        tour_stops: {
          include: {
            location: true,
            media: {
              include: {
                media: true
              }
            }
          },
          orderBy: { sequence_no: 'asc' }
        },
        reviews: {
          include: {
            traveler: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profile_picture_url: true
                  }
                }
              }
            }
          },
          orderBy: { date: 'desc' },
          take: 5
        }
      },
      orderBy: { created_at: 'desc' }
    });
  } catch (error) {
    console.error('Error in findByGuideId repository:', error);
    throw new Error('Failed to fetch tour packages by guide ID');
  }
}
}

export const tourPackageRepository = new TourPackageRepository();
