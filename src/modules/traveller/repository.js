import { PrismaClient } from "@prisma/client";

export class TravellerRepository {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async getPackagesForTraveler(travelerId) {
    // Find all completed payments for this traveler, include the related tour package
    const payments = await this.prisma.payment.findMany({
      where: {
        user_id: travelerId,
        status: 'completed',
        package_id: { not: null }
      },
      include: {
        package: {
          include: {
            cover_image: {
              select: {
                url: true,
              },
            },
            guide: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
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
                        sample_rate: true
                      }
                    }
                  }
                }
              },
              orderBy: {
                sequence_no: 'asc',
              },
            },
            reviews: {
              select: {
                rating: true,
              },
            },
          },
        },
      },
      orderBy: {
        paid_at: 'asc' // or 'id': 'asc'
      }
    });
    console.log('Raw payments:', payments); // <-- Add this line
    // Extract unique tour packages
    const seen = new Set();
    const uniquePackages = [];
    for (const payment of payments) {
      const pkg = payment.package;
      if (pkg && !seen.has(pkg.id)) {
        // Calculate average rating
        const reviews = pkg.reviews || [];
        const averageRating = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0;

        // Flatten media for tour_stops
        const transformedPkg = {
          ...pkg,
          average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
          tour_stops: pkg.tour_stops.map(stop => {
            console.log('Processing stop:', stop.stop_name, 'Media:', stop.media);
            return {
              ...stop,
              media: stop.media.map(tsm => {
                console.log('Media item:', tsm.media);
                return tsm.media;
              })
            };
          })
        };
        uniquePackages.push(transformedPkg);
        seen.add(pkg.id);
      }
    }
    return uniquePackages;
  }

  async getPaidPackagesForTraveler(travelerId) {
    // Find all completed payments for this traveler, include the related tour package
    const payments = await this.prisma.payment.findMany({
      where: {
        user_id: travelerId,
        status: 'completed',
        package_id: { not: null }
      },
      include: {
        package: {
          include: {
            cover_image: {
              select: {
                url: true,
              },
            },
            guide: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
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
                        sample_rate: true
                      }
                    }
                  }
                }
              },
              orderBy: {
                sequence_no: 'asc',
              },
            },
            reviews: {
              select: {
                rating: true,
              },
            },
          },
        },
      },
      orderBy: {
        paid_at: 'asc'
      }
    });

    console.log('Raw paid payments:', payments);

    // Extract unique tour packages
    const seen = new Set();
    const uniquePackages = [];
    for (const payment of payments) {
      const pkg = payment.package;
      if (pkg && !seen.has(pkg.id)) {
        // Calculate average rating
        const reviews = pkg.reviews || [];
        const averageRating = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0;

        // Flatten media for tour_stops
        const transformedPkg = {
          ...pkg,
          average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
          tour_stops: pkg.tour_stops.map(stop => {
            console.log('Processing paid stop:', stop.stop_name, 'Media:', stop.media);
            return {
              ...stop,
              media: stop.media.map(tsm => {
                console.log('Paid media item:', tsm.media);
                return tsm.media;
              })
            };
          })
        };
        uniquePackages.push(transformedPkg);
        seen.add(pkg.id);
      }
    }
    return uniquePackages;
  }

  // Review methods
  async createReview(reviewData) {
    const { traveler_id, package_id, rating, comments, user_id } = reviewData;
    
    // Check if user has already reviewed this package
    const existingReview = await this.prisma.review.findFirst({
      where: {
        traveler_id: traveler_id,
        package_id: package_id
      }
    });

    if (existingReview) {
      throw new Error('You have already reviewed this package');
    }

    // Check if user has purchased this package
    const payment = await this.prisma.payment.findFirst({
      where: {
        user_id: user_id,
        package_id: package_id,
        status: 'completed'
      }
    });

    if (!payment) {
      throw new Error('You can only review packages you have purchased');
    }

    return await this.prisma.review.create({
      data: {
        traveler_id,
        package_id,
        rating,
        comments,
        user_id
      },
      include: {
        traveler: {
          include: {
            user: {
              select: {
                name: true,
                profile_picture_url: true
              }
            }
          }
        },
        package: {
          select: {
            title: true
          }
        }
      }
    });
  }

  async updateReview(reviewId, userId, updateData) {
    // Check if review exists and belongs to user
    const existingReview = await this.prisma.review.findFirst({
      where: {
        id: reviewId,
        user_id: userId
      }
    });

    if (!existingReview) {
      throw new Error('Review not found or you do not have permission to update it');
    }

    return await this.prisma.review.update({
      where: {
        id: reviewId
      },
      data: updateData,
      include: {
        traveler: {
          include: {
            user: {
              select: {
                name: true,
                profile_picture_url: true
              }
            }
          }
        },
        package: {
          select: {
            title: true
          }
        }
      }
    });
  }

  async deleteReview(reviewId, userId) {
    // Check if review exists and belongs to user
    const existingReview = await this.prisma.review.findFirst({
      where: {
        id: reviewId,
        user_id: userId
      }
    });

    if (!existingReview) {
      throw new Error('Review not found or you do not have permission to delete it');
    }

    return await this.prisma.review.delete({
      where: {
        id: reviewId
      }
    });
  }

  async getReviewsByPackage(packageId, limit = 10, offset = 0) {
    return await this.prisma.review.findMany({
      where: {
        package_id: packageId
      },
      include: {
        traveler: {
          include: {
            user: {
              select: {
                name: true,
                profile_picture_url: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: limit,
      skip: offset
    });
  }

  async getReviewsByUser(userId, limit = 10, offset = 0) {
    return await this.prisma.review.findMany({
      where: {
        user_id: userId
      },
      include: {
        package: {
          select: {
            id: true,
            title: true,
            cover_image: {
              select: {
                url: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: limit,
      skip: offset
    });
  }

  async getReviewById(reviewId) {
    return await this.prisma.review.findUnique({
      where: {
        id: reviewId
      },
      include: {
        traveler: {
          include: {
            user: {
              select: {
                name: true,
                profile_picture_url: true
              }
            }
          }
        },
        package: {
          select: {
            title: true,
            cover_image: {
              select: {
                url: true
              }
            }
          }
        }
      }
    });
  }

  async getPackageRatingStats(packageId) {
    const stats = await this.prisma.review.groupBy({
      by: ['rating'],
      where: {
        package_id: packageId
      },
      _count: {
        rating: true
      }
    });

    const totalReviews = await this.prisma.review.count({
      where: {
        package_id: packageId
      }
    });

    const averageRating = await this.prisma.review.aggregate({
      where: {
        package_id: packageId
      },
      _avg: {
        rating: true
      }
    });

    return {
      totalReviews,
      averageRating: averageRating._avg.rating || 0,
      ratingDistribution: stats
    };
  }

  async findNearbyPlaces(latitude, longitude, radius = 5) {
    try {
      console.log('Finding nearby places within', radius, 'km radius:', { latitude, longitude });
      
      // Calculate bounding box for efficient querying
      const boundingBox = this.calculateBoundingBox(latitude, longitude, radius);
      
      // Get all locations within the bounding box with proper image includes
      const locations = await this.prisma.location.findMany({
        where: {
          latitude: {
            gte: boundingBox.minLat,
            lte: boundingBox.maxLat
          },
          longitude: {
            gte: boundingBox.minLng,
            lte: boundingBox.maxLng
          }
        },
        include: {
          pois: {
            where: { status: 'approved' },
            include: {
              vendor: {
                include: {
                  vendor_profile: {
                    select: {
                      cover_url: true,
                      logo_url: true
                    }
                  }
                }
              }
            }
          },
          hidden_places: {
            where: { status: 'approved' },
            include: {
              picture: {
                select: {
                  id: true,
                  url: true,
                  media_type: true
                }
              }
            }
          }
        }
      });

      console.log('Found locations:', locations.length);
      
      // Calculate exact distances and filter by radius
      const nearbyPlaces = [];

      for (const location of locations) {
        const distance = this.calculateDistance(
          latitude, longitude,
          location.latitude, location.longitude
        );

        console.log(`Location ${location.id} distance: ${distance}km`);
        
        // Only include places within the specified radius
        if (distance <= radius) {
          // Add POIs from this location
          for (const poi of location.pois) {
            console.log('Processing POI:', poi.name, 'Vendor:', poi.vendor);
            
            const placeData = {
              id: poi.id,
              name: poi.name,
              category: poi.category,
              description: poi.description,
              type: 'poi',
              place_type: poi.category,
              business_type: poi.type,
              latitude: location.latitude,
              longitude: location.longitude,
              address: location.address,
              city: location.city,
              district: location.district,
              province: location.province,
              distance_km: Math.round(distance * 100) / 100
            };

            // Add image data for POIs
            if (poi.vendor?.vendor_profile) {
              placeData.cover_image = poi.vendor.vendor_profile.cover_url;
              placeData.logo_image = poi.vendor.vendor_profile.logo_url;
              placeData.images = [];
              
              if (poi.vendor.vendor_profile.cover_url) {
                placeData.images.push(poi.vendor.vendor_profile.cover_url);
              }
              if (poi.vendor.vendor_profile.logo_url && poi.vendor.vendor_profile.logo_url !== poi.vendor.vendor_profile.cover_url) {
                placeData.images.push(poi.vendor.vendor_profile.logo_url);
              }
            }

            console.log('POI with images:', placeData);
            nearbyPlaces.push(placeData);
          }

          // Add hidden gems from this location
          for (const hiddenPlace of location.hidden_places) {
            console.log('Processing Hidden Place:', hiddenPlace.title, 'Picture:', hiddenPlace.picture);
            
            const placeData = {
              id: hiddenPlace.id,
              name: hiddenPlace.title,
              category: 'hidden_gem',
              description: hiddenPlace.description,
              type: 'hidden_gem',
              place_type: 'hidden_gem',
              latitude: location.latitude,
              longitude: location.longitude,
              address: location.address,
              city: location.city,
              district: location.district,
              province: location.province,
              distance_km: Math.round(distance * 100) / 100
            };

            // Add image data for hidden places
            if (hiddenPlace.picture) {
              placeData.cover_image = hiddenPlace.picture.url;
              placeData.images = [hiddenPlace.picture.url];
            }

            console.log('Hidden Place with images:', placeData);
            nearbyPlaces.push(placeData);
          }
        }
      }

      // Sort by distance (closest first) and return
      nearbyPlaces.sort((a, b) => a.distance_km - b.distance_km);
      console.log(`Found ${nearbyPlaces.length} places within ${radius}km radius`);
      console.log('Final nearby places with images:', nearbyPlaces);
      
      return nearbyPlaces;

    } catch (error) {
      console.error("Error finding nearby places:", error);
      throw new Error("Failed to find nearby places");
    }
  }
  
  // Calculate bounding box for efficient database querying
  calculateBoundingBox(lat, lng, radiusKm) {
    const earthRadiusKm = 6371;
    const latDelta = (radiusKm / earthRadiusKm) * (180 / Math.PI);
    const lngDelta = (radiusKm / (earthRadiusKm * Math.cos(lat * Math.PI / 180))) * (180 / Math.PI);
    
    return {
      minLat: lat - latDelta,
      maxLat: lat + latDelta,
      minLng: lng - lngDelta,
      maxLng: lng + lngDelta
    };
  }

  // Haversine formula for accurate distance calculation
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}