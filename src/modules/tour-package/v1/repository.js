import prisma from '../../../database/connection.js';

class TourPackageRepository {
  async findMany(filters) {
    const { status, search, location, dateFrom, dateTo, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
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
        skip,
        take: limit
      }),
      prisma.tourPackage.count({ where })
    ]);

    return { packages, total, page, limit };
  }

  async findById(id) {
    return prisma.tourPackage.findUnique({
      where: { id },
      include: {
        guide: {
          include: {
            user: {
              select: { 
                id: true, 
                name: true, 
                email: true,
                phone_no: true,
                profile_picture_url: true,
                bio: true
              }
            }
          }
        },
        cover_image: true,
        tour_stops: {
          orderBy: { sequence_no: 'asc' },
          include: {
            location: true,
            media: {
              include: {
                media: {
                  include: {
                    uploader: {
                      select: {
                        id: true,
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
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
        },
        downloads: {
          orderBy: { date: 'desc' }
        },
        payments: {
          where: { status: 'completed' },
          orderBy: { paid_at: 'desc' }
        }
      }
    });
  }

  async updateStatus(id, status, rejectionReason) {
    return prisma.tourPackage.update({
      where: { id },
      data: {
        status,
        rejection_reason: rejectionReason || null,
        updated_at: new Date()
      },
      include: {
        guide: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });
  }

  async getStatistics() {
    const [pending, published, rejected, total] = await Promise.all([
      prisma.tourPackage.count({ where: { status: 'pending_approval' } }),
      prisma.tourPackage.count({ where: { status: 'published' } }),
      prisma.tourPackage.count({ where: { status: 'rejected' } }),
      prisma.tourPackage.count()
    ]);

    return { pending, published, rejected, total };
  }

  async create(data) {
    if (!data.title || !data.guide_id) {
      throw new Error('Title and guide_id are required');
    }

    const tourData = {
      title: data.title,
      description: data.description || '',
      price: data.price || 0,
      duration_minutes: data.duration_minutes || 0,
      guide_id: data.guide_id,
      status: 'pending_approval',
      created_at: new Date(),
      updated_at: new Date()
    };

    try {
      const tourPackage = await prisma.tourPackage.create({
        data: tourData,
        include: {
          guide: {
            select: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      return {
        success: true,
        data: tourPackage,
        message: 'Tour package created successfully'
      };
    } catch (error) {
      console.error('Error creating tour package:', error);
      
      if (error.code === 'P2002') {
        throw new Error('A tour with similar details already exists');
      }
      
      if (error.code === 'P2003') {
        throw new Error('Invalid guide_id specified');
      }
      
      throw new Error('Failed to create tour package');
    }
  }

  async findByGuideId(guideId , filters = {}) {
    try {
      const guide = await prisma.travelGuide.findUnique({
        where: { 
          user_id: parseInt(guideId) 
        },
        select: { 
          id: true 
        }
      });

      const where = {
        guide_id: guide.id
      };

      if (!guide) {
        return { packages: [], total: 0 };
      }

      if (filters.status && filters.status !== 'all') {
        where.status = filters.status;
      }
      
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const [packages, total] = await Promise.all([
        prisma.tourPackage.findMany({
          where,
          include: {
            guide: {
              include: {
                user: {
                  select: {
                    name: true,
                    profile_picture_url: true
                  }
                }
              }
            },
            cover_image: {
              select: {
                url: true
              }
            },
            tour_stops: {
              include: {
                location: {
                  select: {
                    city: true
                  }
                }
              }
            }
          },
          orderBy: { created_at: 'desc' },
          skip: (filters.page - 1) * filters.limit,
          take: filters.limit
        }),
        prisma.tourPackage.count({ where })
      ]);

      return { packages, total };
    } catch (error) {
      console.error('findByGuideId repository error:', error.message);
      throw error;
    }
  }

  async updateTourPackage(id, data) {
    try {
      const { tour = {}, ...restData } = data;
      const { tour_stops_attributes = [], ...tourData } = tour;

      // 1. Verify package exists
      const packageExists = await prisma.tourPackage.findUnique({
        where: { id },
        select: { id: true, tour_stops: { select: { id: true } } }
      });

      if (!packageExists) {
        throw new Error(`TourPackage with ID ${id} not found`);
      }

      // 2. Validate and prepare media first
      const mediaValidation = await this.validateMediaConnections(tour_stops_attributes);
      if (mediaValidation.invalidMedia.length > 0) {
        throw new Error(`Invalid media IDs: ${mediaValidation.invalidMedia.join(', ')}`);
      }

      // 3. Prepare update data
      const updateData = {
        ...restData,
        ...tourData,
        updated_at: new Date(),
        tour_stops: {
          update: [],
          create: []
        }
      };

      // 4. Process existing stops
      const existingStopIds = packageExists.tour_stops.map(stop => stop.id);
      for (const stop of tour_stops_attributes) {
        if (stop.id && existingStopIds.includes(stop.id)) {
          // Update existing stop
          updateData.tour_stops.update.push({
            where: { id: stop.id },
            data: this.prepareStopUpdateData(stop)
          });
        } else {
          // Create new stop
          updateData.tour_stops.create.push(
            this.prepareStopCreateData(stop)
          );
        }
      }

      // 5. Handle cover image
      if (tourData.cover_image_id) {
        updateData.cover_image = { connect: { id: tourData.cover_image_id } };
      }

      // 6. Execute transaction
      return await prisma.$transaction(async (prisma) => {
        return await prisma.tourPackage.update({
          where: { id },
          data: updateData,
          include: {
            guide: { include: { user: true } },
            cover_image: true,
            tour_stops: {
              include: {
                location: true,
                media: { include: { media: true } }
              },
              orderBy: { sequence_no: 'asc' }
            }
          }
        });
      });

    } catch (error) {
      console.error('Error updating tour package:', {
        error: error.message,
        stack: error.stack,
        inputData: data
      });
      throw new Error(`Failed to update tour package: ${error.message}`);
    }
  }

  async validateMediaConnections(stops) {
    const mediaIds = [];
    const invalidMedia = [];

    // Collect all media IDs from stops
    for (const stop of stops) {
      if (stop.media_attributes) {
        for (const media of stop.media_attributes) {
          if (media.id) {
            mediaIds.push(media.id);
          } else {
            invalidMedia.push('undefined');
          }
        }
      }
    }

    // Check which media IDs actually exist
    if (mediaIds.length > 0) {
      const existingMedia = await prisma.media.findMany({
        where: { id: { in: mediaIds } },
        select: { id: true }
      });

      const existingIds = existingMedia.map(m => m.id);
      for (const id of mediaIds) {
        if (!existingIds.includes(id)) {
          invalidMedia.push(id);
        }
      }
    }

    return { invalidMedia };
  }

  prepareStopUpdateData(stop) {
    const data = {
      sequence_no: stop.sequence_no,
      stop_name: stop.stop_name,
      description: stop.description,
    };

    // Handle location
    if (stop.location_attributes) {
      data.location = stop.location_attributes.id
        ? { update: stop.location_attributes }
        : { create: stop.location_attributes };
    }

    // Handle media
    if (stop.media_attributes?.length > 0) {
      data.media = {
        deleteMany: {},
        create: stop.media_attributes
          .filter(media => media.id)
          .map(media => ({ media: { connect: { id: media.id } }}))
      };
    }

    return data;
  }

  prepareStopCreateData(stop) {
    const data = {
      sequence_no: stop.sequence_no,
      stop_name: stop.stop_name,
      description: stop.description,
    };

    // Handle location
    if (stop.location_attributes) {
      data.location = { create: stop.location_attributes };
    }

    // Handle media
    if (stop.media_attributes?.length > 0) {
      data.media = {
        create: stop.media_attributes
          .filter(media => media.id)
          .map(media => ({ media: { connect: { id: media.id } }}))
      };
    }

    return data;
  }
};

const tourPackageRepository = new TourPackageRepository();
export { tourPackageRepository };