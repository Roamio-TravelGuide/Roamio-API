import prisma from "../../../database/connection.js";
import { StorageRepository } from '../../storage/v1/repository.js';

class TourPackageRepository {
  // ========== QUERY METHODS ==========
  
  async findMany(filters) {
    const {
      status,
      search,
      location,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = filters;
    
    const skip = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
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
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.tourPackage.count({ where }),
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
                bio: true,
              },
            },
          },
        },
        cover_image: true,
        tour_stops: {
          orderBy: { sequence_no: "asc" },
          include: {
            location: true,
            media: {
              include: {
                media: {
                  include: {
                    uploader: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        reviews: {
          include: {
            traveler: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profile_picture_url: true,
                  },
                },
              },
            },
          },
          orderBy: { date: "desc" },
        },
        downloads: {
          orderBy: { date: "desc" },
        },
        payments: {
          where: { status: "completed" },
          orderBy: { paid_at: "desc" },
        },
      },
    });
  }

  async findByGuideId(guideId, filters = {}) {
    try {
      const guide = await prisma.travelGuide.findUnique({
        where: {
          id: parseInt(guideId),
        },
        select: {
          id: true,
          user_id: true,
        },
      });

      if (!guide) {
        return { packages: [], total: 0 };
      }

      const where = {
        guide_id: parseInt(guideId),
      };

      if (filters.status && filters.status !== "all") {
        where.status = filters.status;
      }

      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
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
                    profile_picture_url: true,
                  },
                },
              },
            },
            cover_image: {
              select: {
                url: true,
              },
            },
            tour_stops: {
              include: {
                location: {
                  select: {
                    city: true,
                  },
                },
              },
            },
            _count: {
              select: {
                downloads: true,
                reviews: true,
              }
            }
          },
          orderBy: { created_at: "desc" },
          skip: (filters.page - 1) * filters.limit,
          take: filters.limit,
        }),
        prisma.tourPackage.count({ where }),
      ]);

      return { packages, total };
    } catch (error) {
      console.error("findByGuideId repository error:", error.message);
      throw error;
    }
  }

  async getTourByIdRepository(tourId, tx = prisma) {
    return await tx.tourPackage.findUnique({
      where: { id: tourId },
      include: {
        tour_stops: {
          include: {
            location: true,
            media: {
              include: {
                media: true
              }
            }
          },
          orderBy: {
            sequence_no: 'asc'
          }
        },
        cover_image: true,
        guide: {
          include: {
            user: {
              select: {
                name: true,
                profile_picture_url: true
              }
            }
          }
        }
      }
    });
  }

  async getTourPackageById(tourId) {
    try {
      const tourPackage = await prisma.tourPackage.findUnique({
        where: { id: tourId },
        include: {
          guide: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profile_picture_url: true,
                },
              },
            },
          },
          cover_image: true,
          tour_stops: {
            orderBy: {
              sequence_no: 'asc',
            },
            include: {
              location: true,
              media: {
                include: {
                  media: true,
                },
              },
            },
          },
        },
      });

      if (!tourPackage) {
        throw new Error(`Tour package with ID ${tourId} not found`);
      }

      const transformedTour = {
        ...tourPackage,
        tour_stops: tourPackage.tour_stops.map(stop => ({
          ...stop,
          media: stop.media.map(rel => ({
            ...rel.media,
            type: rel.media.media_type,
          })),
        })),
      };

      return transformedTour;
    } catch (error) {
      throw new Error(`Failed to get tour package by ID: ${error.message}`);
    }
  }

  // ========== CREATE METHODS ==========

  async create(data) {
    if (!data.title || !data.guide_id) {
      throw new Error("Title and guide_id are required");
    }

    const tourData = {
      title: data.title,
      description: data.description || "",
      price: data.price || 0,
      duration_minutes: data.duration_minutes || 0,
      guide_id: data.guide_id,
      status: "pending_approval",
      created_at: new Date(),
      updated_at: new Date(),
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
                  email: true,
                },
              },
            },
          },
        },
      });

      return {
        success: true,
        data: tourPackage,
        message: "Tour package created successfully",
      };
    } catch (error) {
      console.error("Error creating tour package:", error);

      if (error.code === "P2002") {
        throw new Error("A tour with similar details already exists");
      }

      if (error.code === "P2003") {
        throw new Error("Invalid guide_id specified");
      }

      throw new Error("Failed to create tour package");
    }
  }

  async createInitialTourPackage(tourData) {
    try {
      if (!tourData.title || !tourData.guide_id || !tourData.price) {
        throw new Error('Missing required fields: title, guide_id, and price are required');
      }

      const tour = await prisma.tourPackage.create({
        data: {
          title: tourData.title,
          description: tourData.description || null,
          price: parseFloat(tourData.price),
          duration_minutes: parseInt(tourData.duration_minutes) || 0,
          status: tourData.status || 'pending_approval',
          guide_id: parseInt(tourData.guide_id),
        },
      });
      return tour;
    } catch (error) {
      throw new Error(`Failed to create initial tour package: ${error.message}`);
    }
  }

  async createMedia(mediaData) {
    try {
      if (!mediaData.url || !mediaData.media_type || !mediaData.uploaded_by_id) {
        throw new Error('Missing required media fields: url, media_type, uploaded_by_id');
      }

      const media = await prisma.media.create({
        data: {
          url: mediaData.url,
          media_type: mediaData.media_type,
          uploaded_by_id: mediaData.uploaded_by_id,
          file_size: mediaData.file_size || null,
          format: mediaData.format || null,
          duration_seconds: mediaData.duration_seconds || null,
          width: mediaData.width || null,
          height: mediaData.height || null,
          bitrate: mediaData.bitrate || null,
          sample_rate: mediaData.sample_rate || null,
        },
      });
      return media;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new Error(`Media with URL ${mediaData.url} already exists`);
      }
      throw new Error(`Failed to create media record: ${error.message}`);
    }
  }

  async createTourStopsWithMedia({ tourId, stops, stopMediaUrls }) {
    try {
      return await prisma.$transaction(async (tx) => {
        const locations = [];
        for (const stop of stops) {
          const location = await tx.location.create({
            data: {
              longitude: stop.location.longitude,
              latitude: stop.location.latitude,
              address: stop.location.address || null,
              city: stop.location.city || null,
              postal_code: stop.location.postal_code || null,
              district: stop.location.district || null,
              province: stop.location.province || null,
            },
          });
          locations.push(location);
        }

        const tourStops = [];
        for (let i = 0; i < stops.length; i++) {
          const stop = stops[i];
          const location = locations[i];
          
          const tourStop = await tx.tourStop.create({
            data: {
              package_id: tourId,
              sequence_no: stop.sequence_no,
              stop_name: stop.stop_name,
              description: stop.description || null,
              location_id: location.id,
            },
          });
          tourStops.push(tourStop);
        }

        const stopMediaRelations = [];
        for (const [stopIndex, mediaArray] of Object.entries(stopMediaUrls)) {
          const index = parseInt(stopIndex);
          if (index >= 0 && index < tourStops.length && mediaArray.length > 0) {
            const tourStop = tourStops[index];
            
            for (const mediaItem of mediaArray) {
              stopMediaRelations.push(
                tx.tourStopMedia.create({
                  data: {
                    stop_id: tourStop.id,
                    media_id: mediaItem.media_id,
                  },
                })
              );
            }
          }
        }

        if (stopMediaRelations.length > 0) {
          await Promise.all(stopMediaRelations);
        }

        return {
          tourId,
          stopsCreated: tourStops.length,
          mediaRelationsCreated: stopMediaRelations.length,
        };
      });
    } catch (error) {
      throw new Error(`Failed to create tour stops with media: ${error.message}`);
    }
  }

  // ========== UPDATE METHODS ==========

  async updateStatus(id, status, rejectionReason) {
    return prisma.tourPackage.update({
      where: { id },
      data: {
        status,
        rejection_reason: rejectionReason || null,
        updated_at: new Date(),
      },
      include: {
        guide: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });
  }

  async updateTourCover(tourId, coverMediaId) {
    try {
      const updatedTour = await prisma.tourPackage.update({
        where: { id: tourId },
        data: { cover_image_id: coverMediaId },
      });
      return updatedTour;
    } catch (error) {
      throw new Error(`Failed to update tour cover: ${error.message}`);
    }
  }

  async updateTour(id, updateData) {
    try {
      const tour = await prisma.tourPackage.findUnique({
        where: { id: parseInt(id) },
        include: {
          guide: {
            select: {
              user_id: true
            }
          },
          tour_stops: {
            include: {
              media: true
            }
          }
        }
      });

      if (!tour || !tour.guide) {
        throw new Error('Tour package or guide not found');
      }

      const uploaderId = tour.guide.user_id;
      let coverImageId = updateData.cover_image_id;

      if (updateData.cover_image && !coverImageId) {
        const coverImageData = updateData.cover_image;
        const existingMedia = await prisma.media.findUnique({
          where: { url: coverImageData.url }
        });

        if (existingMedia) {
          coverImageId = existingMedia.id;
        } else {
          const newMedia = await prisma.media.create({
            data: {
              url: coverImageData.url,
              s3_key: coverImageData.s3_key || '',
              media_type: coverImageData.media_type || 'image',
              file_size: coverImageData.file_size ? BigInt(coverImageData.file_size) : null,
              format: coverImageData.format || null,
              uploaded_by_id: uploaderId
            }
          });
          coverImageId = newMedia.id;
        }
      }

      await Promise.all(updateData.tour_stops.map(async (stop) => {
        if (stop.media) {
          await Promise.all(stop.media.map(async (media) => {
            if (!media.id && media.url) {
              const existingMedia = await prisma.media.findUnique({
                where: { url: media.url }
              });

              if (existingMedia) {
                media.id = existingMedia.id;
              } else {
                const newMedia = await prisma.media.create({
                  data: {
                    url: media.url,
                    s3_key: media.key || media.s3_key || '',
                    media_type: media.media_type,
                    duration_seconds: media.duration_seconds || null,
                    file_size: media.file_size ? BigInt(media.file_size) : null,
                    format: media.format || null,
                    uploaded_by_id: uploaderId
                  }
                });
                media.id = newMedia.id;
              }
            }
          }));
        }
      }));

      const stopsToKeepIds = updateData.tour_stops
        .filter(stop => stop.id)
        .map(stop => stop.id);

      await prisma.tourStopMedia.deleteMany({
        where: {
          stop_id: {
            notIn: stopsToKeepIds,
            in: tour.tour_stops.map(stop => stop.id)
          }
        }
      });

      await prisma.tourStop.deleteMany({
        where: {
          id: {
            notIn: stopsToKeepIds
          },
          package_id: parseInt(id)
        }
      });

      return await prisma.tourPackage.update({
        where: { id: parseInt(id) },
        data: {
          title: updateData.title,
          description: updateData.description,
          price: updateData.price,
          duration_minutes: updateData.duration_minutes,
          status: updateData.status,
          rejection_reason: updateData.rejection_reason,
          updated_at: new Date(),
          ...(coverImageId && { 
            cover_image_id: coverImageId
          }),
          tour_stops: {
            upsert: updateData.tour_stops.map(stop => ({
              where: { id: stop.id || -1 },
              update: {
                sequence_no: stop.sequence_no,
                stop_name: stop.stop_name,
                description: stop.description,
                ...(stop.location && {
                  location: {
                    upsert: {
                      create: {
                        latitude: stop.location.latitude,
                        longitude: stop.location.longitude,
                        address: stop.location.address,
                        city: stop.location.city,
                        province: stop.location.province,
                        district: stop.location.district,
                        postal_code: stop.location.postal_code
                      },
                      update: {
                        latitude: stop.location.latitude,
                        longitude: stop.location.longitude,
                        address: stop.location.address,
                        city: stop.location.city,
                        province: stop.location.province,
                        district: stop.location.district,
                        postal_code: stop.location.postal_code
                      }
                    }
                  }
                })
              },
              create: {
                sequence_no: stop.sequence_no,
                stop_name: stop.stop_name,
                description: stop.description,
                ...(stop.location && {
                  location: {
                    create: {
                      latitude: stop.location.latitude,
                      longitude: stop.location.longitude,
                      address: stop.location.address,
                      city: stop.location.city,
                      province: stop.location.province,
                      district: stop.location.district,
                      postal_code: stop.location.postal_code
                    }
                  }
                })
              }
            }))
          }
        },
        include: {
          guide: {
            include: {
              user: true
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
          }
        }
      }).then(async (updatedPackage) => {
        await Promise.all(updateData.tour_stops.map(async (stop) => {
          if (stop.media) {
            await prisma.tourStopMedia.deleteMany({
              where: { stop_id: stop.id }
            });

            await prisma.tourStopMedia.createMany({
              data: stop.media.map(media => ({
                stop_id: stop.id,
                media_id: media.id
              })),
              skipDuplicates: true
            });
          }
        }));

        return prisma.tourPackage.findUnique({
          where: { id: parseInt(id) },
          include: {
            guide: {
              include: {
                user: true
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
              orderBy: { sequence_no: "asc" },
            },
          },
        });
      });
    } catch (error) {
      console.error('Tour update error:', error);
      throw new Error(`Failed to update tour: ${error.message}`);
    }
  }

  async updateTourPackageWithStops(tourId, tourData, stops, stopMediaUrls = {}) {
    try {
      return await prisma.$transaction(async (tx) => {
        const updatedTour = await tx.tourPackage.update({
          where: { id: tourId },
          data: {
            title: tourData.title,
            description: tourData.description,
            price: parseFloat(tourData.price),
            duration_minutes: parseInt(tourData.duration_minutes),
            status: tourData.status || 'pending_approval',
            rejection_reason: tourData.rejection_reason || null,
            updated_at: new Date(),
          },
        });

        const existingStops = await tx.tourStop.findMany({
          where: { package_id: tourId },
          include: { location: true, media: { include: { media: true } } }
        });

        for (let i = 0; i < stops.length; i++) {
          const stop = stops[i];
          const existingStop = existingStops.find(s => s.id === stop.id);
          
          if (existingStop) {
            await this.updateExistingStop(tx, existingStop, stop, stopMediaUrls[i] || []);
          } else {
            await this.createNewStop(tx, tourId, stop, stopMediaUrls[i] || []);
          }
        }

        const updatedStopIds = stops.map(s => s.id).filter(id => id);
        const stopsToDelete = existingStops.filter(s => !updatedStopIds.includes(s.id));
        
        if (stopsToDelete.length > 0) {
          await tx.tourStop.deleteMany({
            where: {
              id: { in: stopsToDelete.map(s => s.id) }
            }
          });
        }

        return await this.getTourPackageById(tourId);
      });
    } catch (error) {
      throw new Error(`Failed to update tour package with stops: ${error.message}`);
    }
  }

  async updateExistingStop(tx, existingStop, stopData, mediaUrls) {
    await tx.tourStop.update({
      where: { id: existingStop.id },
      data: {
        sequence_no: stopData.sequence_no,
        stop_name: stopData.stop_name,
        description: stopData.description || '',
      }
    });

    if (stopData.location) {
      await tx.location.upsert({
        where: { id: existingStop.location_id },
        update: {
          longitude: parseFloat(stopData.location.longitude),
          latitude: parseFloat(stopData.location.latitude),
          address: stopData.location.address || '',
          city: stopData.location.city || '',
          province: stopData.location.province || '',
          district: stopData.location.district || '',
          postal_code: stopData.location.postal_code || '',
        },
        create: {
          longitude: parseFloat(stopData.location.longitude),
          latitude: parseFloat(stopData.location.latitude),
          address: stopData.location.address || '',
          city: stopData.location.city || '',
          province: stopData.location.province || '',
          district: stopData.location.district || '',
          postal_code: stopData.location.postal_code || '',
        }
      });
    }

    if (mediaUrls.length > 0) {
      await tx.tourStopMedia.deleteMany({
        where: { stop_id: existingStop.id }
      });

      const mediaRelations = mediaUrls.map(mediaUrl => ({
        stop_id: existingStop.id,
        media_id: mediaUrl.media_id
      }));

      await tx.tourStopMedia.createMany({
        data: mediaRelations,
        skipDuplicates: true
      });
    }
  }

  async createNewStop(tx, tourId, stopData, mediaUrls) {
    const location = await tx.location.create({
      data: {
        longitude: parseFloat(stopData.location.longitude),
        latitude: parseFloat(stopData.location.latitude),
        address: stopData.location.address || '',
        city: stopData.location.city || '',
        province: stopData.location.province || '',
        district: stopData.location.district || '',
        postal_code: stopData.location.postal_code || '',
      }
    });

    const tourStop = await tx.tourStop.create({
      data: {
        package_id: tourId,
        sequence_no: stopData.sequence_no,
        stop_name: stopData.stop_name,
        description: stopData.description || '',
        location_id: location.id,
      }
    });

    if (mediaUrls.length > 0) {
      const mediaRelations = mediaUrls.map(mediaUrl => ({
        stop_id: tourStop.id,
        media_id: mediaUrl.media_id
      }));

      await tx.tourStopMedia.createMany({
        data: mediaRelations,
        skipDuplicates: true
      });
    }

    return tourStop;
  }

  // ========== DELETE METHODS ==========

  async deleteTourPackage(id) {
    try {
      const packageId = parseInt(id);
      const storageRepository = new StorageRepository();
      
      const packageToDelete = await prisma.tourPackage.findUnique({
        where: { id: packageId },
        select: {
          id: true,
          cover_image: {
            select: {
              id: true,
              s3_key: true
            }
          },
          tour_stops: {
            select: {
              id: true,
              media: {
                select: {
                  media: {
                    select: {
                      id: true,
                      s3_key: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!packageToDelete) {
        throw new Error(`TourPackage with ID ${id} not found`);
      }

      const mediaToDelete = [];

      if (packageToDelete.cover_image?.s3_key) {
        mediaToDelete.push(packageToDelete.cover_image.s3_key);
      }

      packageToDelete.tour_stops.forEach(stop => {
        stop.media.forEach(({ media }) => {
          if (media?.s3_key) {
            mediaToDelete.push(media.s3_key);
          }
        });
      });

      await prisma.$transaction(async (prisma) => {
        await prisma.review.deleteMany({
          where: { package_id: packageId }
        });

        await prisma.download.deleteMany({
          where: { package_id: packageId }
        });

        await prisma.payment.deleteMany({
          where: { package_id: packageId }
        });

        for (const stop of packageToDelete.tour_stops) {
          await prisma.tourStopMedia.deleteMany({
            where: { stop_id: stop.id }
          });
        }

        await prisma.tourStop.deleteMany({
          where: { package_id: packageId }
        });

        if (packageToDelete.cover_image) {
          await prisma.media.delete({
            where: { id: packageToDelete.cover_image.id }
          });
        }

        await prisma.tourPackage.delete({
          where: { id: packageId }
        });

        if (mediaToDelete.length > 0) {
          await Promise.all(
            mediaToDelete.map(key => 
              storageRepository.deleteFile(key).catch(e => 
                console.error(`Failed to delete media ${key}:`, e)
              )
            )
          );
        }
      });

      await storageRepository.disconnect();

      return {
        success: true,
        message: 'Tour package deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting tour package:', {
        error: error.message,
        stack: error.stack,
        packageId: id
      });
      
      if (error.code === 'P2025') {
        throw new Error('Tour package not found');
      }
      
      throw new Error(`Failed to delete tour package: ${error.message}`);
    }
  }

  // ========== STATISTICS METHODS ==========

  async getStatistics() {
    const [pending, published, rejected, total] = await Promise.all([
      prisma.tourPackage.count({ where: { status: "pending_approval" } }),
      prisma.tourPackage.count({ where: { status: "published" } }),
      prisma.tourPackage.count({ where: { status: "rejected" } }),
      prisma.tourPackage.count(),
    ]);

    return { pending, published, rejected, total };
  }

  // ========== HELPER METHODS ==========

  prepareMediaUpdates(mediaAttributes) {
    if (!mediaAttributes || !Array.isArray(mediaAttributes)) {
      return {};
    }

    return {
      deleteMany: {},
      create: mediaAttributes.map(media => ({
        media: {
          connectOrCreate: {
            where: { id: media.id || -1 },
            create: {
              url: media.url,
              media_type: media.media_type,
              uploaded_by_id: media.uploaded_by_id,
              file_size: media.file_size,
              format: media.format,
              duration_seconds: media.duration_seconds,
              width: media.width,
              height: media.height,
              bitrate: media.bitrate,
              sample_rate: media.sample_rate,
            }
          }
        }
      }))
    };
  }
}

const tourPackageRepository = new TourPackageRepository();
export { tourPackageRepository };