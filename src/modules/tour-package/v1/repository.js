import prisma from "../../../database/connection.js";
import { StorageRepository } from '../../storage/v1/repository.js';

class TourPackageRepository {
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

  async getStatistics() {
    const [pending, published, rejected, total] = await Promise.all([
      prisma.tourPackage.count({ where: { status: "pending_approval" } }),
      prisma.tourPackage.count({ where: { status: "published" } }),
      prisma.tourPackage.count({ where: { status: "rejected" } }),
      prisma.tourPackage.count(),
    ]);

    return { pending, published, rejected, total };
  }

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

  async findByGuideId(guideId, filters = {}) {
    try {
      const guide = await prisma.travelGuide.findUnique({
        where: {
          user_id: parseInt(guideId),
        },
        select: {
          id: true,
        },
      });

      const where = {
        guide_id: guide.id,
      };

      if (!guide) {
        return { packages: [], total: 0 };
      }

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

async updateTourPackage(id, updateData) {
  const { tour = {}, ...restData } = updateData;
  const { tour_stops_attributes = [], cover_image_id, ...tourData } = tour;

  return await prisma.$transaction(async (prisma) => {
    // 1. Update the main tour package
    const updatePayload = {
      ...tourData,
      updated_at: new Date(),
      ...(cover_image_id && {
        cover_image: { connect: { id: parseInt(cover_image_id) } }
        }
      )
    };

    // Remove cover_image_id from the payload if it exists since we're handling it via connect
    if (updatePayload.cover_image_id !== undefined) {
      delete updatePayload.cover_image_id;
    }

    const updatedPackage = await prisma.tourPackage.update({
      where: { id },
      data: updatePayload,
      include: {
        cover_image: true,
        tour_stops: {
          include: {
            location: true,
            media: {
              include: {
                media: true
              }
            }
          }
        }
      }
    });

    // 2. Update tour stops
    await this.updateTourStops(prisma, id, tour_stops_attributes);

    // 3. Fetch the complete updated package to return
    return await prisma.tourPackage.findUnique({
      where: { id },
      include: {
        guide: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
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
                media: true
              }
            }
          }
        }
      }
    });
  });
}

  async updateTourStops(prisma, packageId, stops) {
    // First get existing stops to compare
    const existingStops = await prisma.tourStop.findMany({
      where: { package_id: packageId },
      select: { id: true }
    });
    
    const existingStopIds = existingStops.map(stop => stop.id);
    const incomingStopIds = stops.map(stop => parseInt(stop.id)).filter(id => !isNaN(id));

    // Delete stops that are not in the incoming data
    const stopsToDelete = existingStopIds.filter(id => !incomingStopIds.includes(id));
    if (stopsToDelete.length > 0) {
      await prisma.tourStop.deleteMany({
        where: { id: { in: stopsToDelete } }
      });
    }

    // Update or create stops
    for (const stop of stops) {
      const stopId = stop.id ? parseInt(stop.id) : undefined;
      const stopData = {
        sequence_no: parseInt(stop.sequence_no),
        stop_name: stop.stop_name,
        description: stop.description || '',
        ...(stop.location_attributes && {
          location: {
            upsert: {
              create: {
                longitude: parseFloat(stop.location_attributes.longitude),
                latitude: parseFloat(stop.location_attributes.latitude),
                address: stop.location_attributes.address,
                city: stop.location_attributes.city,
                province: stop.location_attributes.province,
                district: stop.location_attributes.district || '',
                postal_code: stop.location_attributes.postal_code || ''
              },
              update: {
                longitude: parseFloat(stop.location_attributes.longitude),
                latitude: parseFloat(stop.location_attributes.latitude),
                address: stop.location_attributes.address,
                city: stop.location_attributes.city,
                province: stop.location_attributes.province,
                district: stop.location_attributes.district || '',
                postal_code: stop.location_attributes.postal_code || ''
              }
            }
          }
        }),
        ...(stop.media_attributes && {
          media: this.prepareMediaUpdates(stop.media_attributes)
        })
      };

      if (stopId) {
        // Update existing stop
        await prisma.tourStop.update({
          where: { id: stopId },
          data: stopData
        });
      } else {
        // Create new stop
        await prisma.tourStop.create({
          data: {
            ...stopData,
            package_id: packageId
          }
        });
      }
    }
  }

  prepareMediaUpdates(mediaAttributes) {
    const updates = {
      deleteMany: {}, // This will delete all existing media associations
      create: [],
      connect: []
    };

    mediaAttributes.forEach(media => {
      if (media.id && media.keep === "true") {
        updates.connect.push({ media_id: parseInt(media.id) });
      } else if (media.file || media.temp_id) {
        updates.create.push({
          media: {
            create: {
              url: media.url || '',
              s3_key: media.s3_key || '',
              media_type: media.media_type,
              duration_seconds: parseInt(media.duration_seconds) || 0,
              uploaded_by_id: parseInt(media.uploaded_by_id) || 1,
              file_size: parseInt(media.file_size) || 0,
              format: media.format || ''
            }
          }
        });
      }
    });

    return updates;
  }

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

  // async updateTour(id, updateData) {
  //   try {
  //     const tour = await prisma.tourPackage.findUnique({
  //       where: { id: parseInt(id) },
  //       select: {
  //         guide: {
  //           select: {
  //             user_id: true
  //           }
  //         }
  //       }
  //     });

  //     if (!tour || !tour.guide) {
  //       throw new Error('Tour package or guide not found');
  //     }

  //     const uploaderId = tour.guide.user_id;

  //     await Promise.all(updateData.tour_stops.map(async (stop) => {
  //       if (stop.media) {
  //         await Promise.all(stop.media.map(async (media) => {
  //           if (!media.id && media.url) {
  //             // Check if media exists
  //             const existingMedia = await prisma.media.findUnique({
  //               where: { url: media.url }
  //             });

  //             if (existingMedia) {
  //               media.id = existingMedia.id;
  //             } else {
  //               // Create new media with guide's user_id as uploader
  //               const newMedia = await prisma.media.create({
  //                 data: {
  //                   url: media.url,
  //                   s3_key: media.key || media.s3_key || '',
  //                   media_type: media.media_type,
  //                   duration_seconds: media.duration_seconds || null,
  //                   file_size: media.file_size || null,
  //                   format: media.format || null,
  //                   uploaded_by_id: uploaderId
  //                 }
  //               });
  //               media.id = newMedia.id;
  //             }
  //           }
  //         }));
  //       }
  //     }));

  //     return await prisma.tourPackage.update({
  //       where: { id: parseInt(id) },
  //       data: {
  //         title: updateData.title,
  //         description: updateData.description,
  //         price: updateData.price,
  //         duration_minutes: updateData.duration_minutes,
  //         status: updateData.status,
  //         rejection_reason: updateData.rejection_reason,
  //         updated_at: new Date(),
  //         ...(updateData.cover_image_id && { 
  //           cover_image: { connect: { id: updateData.cover_image_id } }
  //         }),
  //         tour_stops: {
  //           deleteMany: {
  //             id: {
  //               notIn: updateData.tour_stops
  //                 .filter(stop => stop.id)
  //                 .map(stop => stop.id)
  //             }
  //           },
  //           upsert: updateData.tour_stops.map(stop => ({
  //             where: { id: stop.id || -1 },
  //             update: {
  //               sequence_no: stop.sequence_no,
  //               stop_name: stop.stop_name,
  //               description: stop.description,
  //               ...(stop.location && {
  //                 location: {
  //                   upsert: {
  //                     create: {
  //                       latitude: stop.location.latitude,
  //                       longitude: stop.location.longitude,
  //                       address: stop.location.address,
  //                       city: stop.location.city,
  //                       province: stop.location.province,
  //                       district: stop.location.district,
  //                       postal_code: stop.location.postal_code
  //                     },
  //                     update: {
  //                       latitude: stop.location.latitude,
  //                       longitude: stop.location.longitude,
  //                       address: stop.location.address,
  //                       city: stop.location.city,
  //                       province: stop.location.province,
  //                       district: stop.location.district,
  //                       postal_code: stop.location.postal_code
  //                     }
  //                   }
  //                 }
  //               }),
  //               media: stop.media ? {
  //                 deleteMany: { stop_id: stop.id },
  //                 create: stop.media.map(media => ({
  //                   media_id: media.id
  //                 }))
  //               } : undefined
  //             },
  //             create: {
  //               sequence_no: stop.sequence_no,
  //               stop_name: stop.stop_name,
  //               description: stop.description,
  //               ...(stop.location && {
  //                 location: {
  //                   create: {
  //                     latitude: stop.location.latitude,
  //                     longitude: stop.location.longitude,
  //                     address: stop.location.address,
  //                     city: stop.location.city,
  //                     province: stop.location.province,
  //                     district: stop.location.district,
  //                     postal_code: stop.location.postal_code
  //                   }
  //                 }
  //               }),
  //               ...(stop.media && {
  //                 media: {
  //                   create: stop.media.map(media => ({
  //                     media_id: media.id
  //                   }))
  //                 }
  //               })
  //             }
  //           }))
  //         }
  //       },
  //       include: {
  //         guide: {
  //           include: {
  //             user: true
  //           }
  //         },
  //         cover_image: true,
  //         tour_stops: {
  //           include: {
  //             location: true,
  //             media: {
  //               include: {
  //                 media: true
  //               }
  //             }
  //           },
  //           orderBy: { sequence_no: 'asc' }
  //         }
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Tour update error:', error);
  //     throw new Error(`Failed to update tour: ${error.message}`);
  //   }
  // }

  // async updateTour(id, updateData) {
  //   try {
  //     const tour = await prisma.tourPackage.findUnique({
  //       where: { id: parseInt(id) },
  //       select: {
  //         guide: {
  //           select: {
  //             user_id: true
  //           }
  //         }
  //       }
  //     });

  //     if (!tour || !tour.guide) {
  //       throw new Error('Tour package or guide not found');
  //     }

  //     const uploaderId = tour.guide.user_id;

  //     // Handle cover image if present
  //     let coverImageId = updateData.cover_image_id;
  //     if (updateData.cover_image && !coverImageId) {
  //       const coverImageData = updateData.cover_image;
        
  //       // Check if media exists with this URL
  //       const existingMedia = await prisma.media.findUnique({
  //         where: { url: coverImageData.url }
  //       });

  //       if (existingMedia) {
  //         coverImageId = existingMedia.id;
  //       } else {
  //         // Create new media record for cover image
  //         const newMedia = await prisma.media.create({
  //           data: {
  //             url: coverImageData.url,
  //             s3_key: coverImageData.s3_key || '',
  //             media_type: coverImageData.media_type || 'image',
  //             file_size: coverImageData.file_size ? BigInt(coverImageData.file_size) : null,
  //             format: coverImageData.format || null,
  //             uploaded_by_id: uploaderId
  //           }
  //         });
  //         coverImageId = newMedia.id;
  //       }
  //     }

  //     // Process tour stop media
  //     await Promise.all(updateData.tour_stops.map(async (stop) => {
  //       if (stop.media) {
  //         await Promise.all(stop.media.map(async (media) => {
  //           if (!media.id && media.url) {
  //             // Check if media exists
  //             const existingMedia = await prisma.media.findUnique({
  //               where: { url: media.url }
  //             });

  //             if (existingMedia) {
  //               media.id = existingMedia.id;
  //             } else {
  //               // Create new media with guide's user_id as uploader
  //               const newMedia = await prisma.media.create({
  //                 data: {
  //                   url: media.url,
  //                   s3_key: media.key || media.s3_key || '',
  //                   media_type: media.media_type,
  //                   duration_seconds: media.duration_seconds || null,
  //                   file_size: media.file_size ? BigInt(media.file_size) : null,
  //                   format: media.format || null,
  //                   uploaded_by_id: uploaderId
  //                 }
  //               });
  //               media.id = newMedia.id;
  //             }
  //           }
  //         }));
  //       }
  //     }));

  //     return await prisma.tourPackage.update({
  //       where: { id: parseInt(id) },
  //       data: {
  //         title: updateData.title,
  //         description: updateData.description,
  //         price: updateData.price,
  //         duration_minutes: updateData.duration_minutes,
  //         status: updateData.status,
  //         rejection_reason: updateData.rejection_reason,
  //         updated_at: new Date(),
  //         ...(coverImageId && { 
  //           cover_image_id: coverImageId
  //         }),
  //         tour_stops: {
  //           deleteMany: {
  //             id: {
  //               notIn: updateData.tour_stops
  //                 .filter(stop => stop.id)
  //                 .map(stop => stop.id)
  //             }
  //           },
  //           upsert: updateData.tour_stops.map(stop => ({
  //             where: { id: stop.id || -1 },
  //             update: {
  //               sequence_no: stop.sequence_no,
  //               stop_name: stop.stop_name,
  //               description: stop.description,
  //               ...(stop.location && {
  //                 location: {
  //                   upsert: {
  //                     create: {
  //                       latitude: stop.location.latitude,
  //                       longitude: stop.location.longitude,
  //                       address: stop.location.address,
  //                       city: stop.location.city,
  //                       province: stop.location.province,
  //                       district: stop.location.district,
  //                       postal_code: stop.location.postal_code
  //                     },
  //                     update: {
  //                       latitude: stop.location.latitude,
  //                       longitude: stop.location.longitude,
  //                       address: stop.location.address,
  //                       city: stop.location.city,
  //                       province: stop.location.province,
  //                       district: stop.location.district,
  //                       postal_code: stop.location.postal_code
  //                     }
  //                   }
  //                 }
  //               }),
  //               media: stop.media ? {
  //                 deleteMany: { stop_id: stop.id },
  //                 create: stop.media.map(media => ({
  //                   media_id: media.id
  //                 }))
  //               } : undefined
  //             },
  //             create: {
  //               sequence_no: stop.sequence_no,
  //               stop_name: stop.stop_name,
  //               description: stop.description,
  //               ...(stop.location && {
  //                 location: {
  //                   create: {
  //                     latitude: stop.location.latitude,
  //                     longitude: stop.location.longitude,
  //                     address: stop.location.address,
  //                     city: stop.location.city,
  //                     province: stop.location.province,
  //                     district: stop.location.district,
  //                     postal_code: stop.location.postal_code
  //                   }
  //                 }
  //               }),
  //               ...(stop.media && {
  //                 media: {
  //                   create: stop.media.map(media => ({
  //                     media_id: media.id
  //                   }))
  //                 }
  //               })
  //             }
  //           }))
  //         }
  //       },
  //       include: {
  //         guide: {
  //           include: {
  //             user: true
  //           }
  //         },
  //         cover_image: true,
  //         tour_stops: {
  //           include: {
  //             location: true,
  //             media: {
  //               include: {
  //                 media: true
  //               }
  //             }
  //           },
  //           orderBy: { sequence_no: 'asc' }
  //         }
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Tour update error:', error);
  //     throw new Error(`Failed to update tour: ${error.message}`);
  //   }
  // }

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

      // Handle cover image if present
      let coverImageId = updateData.cover_image_id;
      if (updateData.cover_image && !coverImageId) {
        const coverImageData = updateData.cover_image;
        
        // Check if media exists with this URL
        const existingMedia = await prisma.media.findUnique({
          where: { url: coverImageData.url }
        });

        if (existingMedia) {
          coverImageId = existingMedia.id;
        } else {
          // Create new media record for cover image
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

      // Process tour stop media
      await Promise.all(updateData.tour_stops.map(async (stop) => {
        if (stop.media) {
          await Promise.all(stop.media.map(async (media) => {
            if (!media.id && media.url) {
              // Check if media exists
              const existingMedia = await prisma.media.findUnique({
                where: { url: media.url }
              });

              if (existingMedia) {
                media.id = existingMedia.id;
              } else {
                // Create new media with guide's user_id as uploader
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

      // First delete media associations for stops that will be deleted
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

      // Then delete the stops that aren't in the update data
      await prisma.tourStop.deleteMany({
        where: {
          id: {
            notIn: stopsToKeepIds
          },
          package_id: parseInt(id)
        }
      });

      // Now update/create the stops and their media
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
        // Now handle media associations separately
        await Promise.all(updateData.tour_stops.map(async (stop) => {
          if (stop.media) {
            // First delete existing media associations for this stop
            await prisma.tourStopMedia.deleteMany({
              where: { stop_id: stop.id }
            });

            // Then create new associations
            await prisma.tourStopMedia.createMany({
              data: stop.media.map(media => ({
                stop_id: stop.id,
                media_id: media.id
              })),
              skipDuplicates: true
            });
          }
        }));

        // Return the fully updated package
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
}

const tourPackageRepository = new TourPackageRepository();
export { tourPackageRepository };
