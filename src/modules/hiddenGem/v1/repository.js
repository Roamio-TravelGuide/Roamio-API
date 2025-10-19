import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class HiddenGemRepository {
  async findByTravelerId(travelerId) {
    try {
      const hiddenPlaces = await prisma.hiddenPlace.findMany({
        where: {
          traveler_id: parseInt(travelerId),
        },
        include: {
          traveler: {
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
          location: {
            select: {
              id: true,
              latitude: true,
              longitude: true,
              address: true,
              city: true,
              province: true,
              district: true,
              postal_code: true,
            },
          },
          picture: {
            select: {
              id: true,
              url: true,
              media_type: true,
              width: true,
              height: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

      return hiddenPlaces;
    } catch (error) {
      console.error("findByTravelerId repository error:", error.message);
      throw error;
    }
  }

  async countByTravelerId(travelerId) {
    try {
      const count = await prisma.hiddenPlace.count({
        where: {
          traveler_id: parseInt(travelerId),
        },
      });
      return count;
    } catch (error) {
      console.error("countByTravelerId repository error:", error.message);
      throw error;
    }
  }

  async createInitialHiddenGem(hiddenGemData) {
    try {
      const { name, description, latitude, longitude, address, traveler_id } =
        hiddenGemData;

      // First create location
      const location = await prisma.location.create({
        data: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          address: address,
          city: null,
          province: null,
          district: null,
          postal_code: null,
        },
      });

      // Then create hidden place
      const hiddenGem = await prisma.hiddenPlace.create({
        data: {
          title: name, // Note: schema uses 'title' not 'name'
          description: description,
          traveler_id: parseInt(traveler_id),
          location_id: location.id,
          picture_id: null,
          status: "pending", // Default status from schema
          created_at: new Date(),
          verified_at: null,
          rejection_reason: null,
        },
        include: {
          location: true,
          traveler: {
            include: {
              user: true,
            },
          },
        },
      });

      return hiddenGem;
    } catch (error) {
      console.error("createInitialHiddenGem repository error:", error.message);
      throw error;
    }
  }

  async createMedia(mediaData) {
    try {
      const media = await prisma.media.create({
        data: {
          url: mediaData.url,
          media_type: mediaData.media_type,
          uploaded_by_id: mediaData.uploaded_by_id,
          file_size: mediaData.file_size,
          format: mediaData.format,
          width: mediaData.width,
          height: mediaData.height,
          duration_seconds: mediaData.duration_seconds,
          created_at: new Date(),
        },
      });

      return media;
    } catch (error) {
      console.error("createMedia repository error:", error.message);
      throw error;
    }
  }

  async updateHiddenGemWithPicture(hiddenGemId, pictureId) {
    try {
      const hiddenGem = await prisma.hiddenPlace.update({
        where: {
          id: parseInt(hiddenGemId),
        },
        data: {
          picture_id: parseInt(pictureId),
        },
        include: {
          location: true,
          picture: true,
          traveler: {
            include: {
              user: true,
            },
          },
        },
      });

      return hiddenGem;
    } catch (error) {
      console.error(
        "updateHiddenGemWithPicture repository error:",
        error.message
      );
      throw error;
    }
  }

  async getHiddenGemById(hiddenGemId) {
    try {
      const hiddenGem = await prisma.hiddenPlace.findUnique({
        where: {
          id: parseInt(hiddenGemId),
        },
        include: {
          traveler: {
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
          location: {
            select: {
              id: true,
              latitude: true,
              longitude: true,
              address: true,
              city: true,
              province: true,
              district: true,
              postal_code: true,
            },
          },
          picture: {
            select: {
              id: true,
              url: true,
              media_type: true,
              file_size: true,
              format: true,
              width: true,
              height: true,
            },
          },
        },
      });

      return hiddenGem;
    } catch (error) {
      console.error("getHiddenGemById repository error:", error.message);
      throw error;
    }
  }

  async getTravelerByUserId(userId) {
    try {
      const traveler = await prisma.traveler.findUnique({
        where: {
          user_id: parseInt(userId),
        },
        include: {
          user: true,
        },
      });

      if (!traveler) {
        throw new Error("Traveler profile not found for user");
      }

      return traveler;
    } catch (error) {
      console.error("getTravelerByUserId repository error:", error.message);
      throw error;
    }
  }

  // NEW METHOD: Find hidden gems for moderation with filtering
  async findForModeration(filters) {
    try {
      const { status, search, location, page, limit, sortBy, sortOrder } =
        filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where = {
        status: status === "all" ? undefined : status,
      };

      // Add search filter
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      // Add location filter
      if (location && location !== "all") {
        where.location = {
          OR: [
            { city: { contains: location, mode: "insensitive" } },
            { district: { contains: location, mode: "insensitive" } },
            { province: { contains: location, mode: "insensitive" } },
          ],
        };
      }

      // Get hidden places with pagination
      const hiddenPlaces = await prisma.hiddenPlace.findMany({
        where,
        include: {
          traveler: {
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
          location: {
            select: {
              id: true,
              latitude: true,
              longitude: true,
              address: true,
              city: true,
              province: true,
              district: true,
              postal_code: true,
            },
          },
          picture: {
            select: {
              id: true,
              url: true,
              media_type: true,
              width: true,
              height: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      });

      // Get total count for pagination
      const totalCount = await prisma.hiddenPlace.count({ where });

      return {
        hiddenPlaces,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      };
    } catch (error) {
      console.error("findForModeration repository error:", error.message);
      throw error;
    }
  }

  // NEW METHOD: Update hidden gem status
  async updateStatus(updateData) {
    try {
      const { hiddenGemId, status, rejectionReason, verifiedAt } = updateData;

      const updatedGem = await prisma.hiddenPlace.update({
        where: {
          id: hiddenGemId,
        },
        data: {
          status,
          rejection_reason: rejectionReason,
          verified_at: verifiedAt,
        },
        include: {
          traveler: {
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
          location: {
            select: {
              id: true,
              latitude: true,
              longitude: true,
              address: true,
              city: true,
              province: true,
              district: true,
              postal_code: true,
            },
          },
          picture: {
            select: {
              id: true,
              url: true,
              media_type: true,
              width: true,
              height: true,
            },
          },
        },
      });

      return updatedGem;
    } catch (error) {
      console.error("updateStatus repository error:", error.message);
      throw error;
    }
  }

  // NEW METHOD: Get moderation statistics
  async getModerationStats() {
    try {
      const stats = await prisma.hiddenPlace.groupBy({
        by: ["status"],
        _count: {
          id: true,
        },
      });

      // Convert to more usable format
      const statsObject = {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
      };

      stats.forEach((stat) => {
        statsObject[stat.status] = stat._count.id;
        statsObject.total += stat._count.id;
      });

      return statsObject;
    } catch (error) {
      console.error("getModerationStats repository error:", error.message);
      throw error;
    }
  }
}

const hiddenGemRepository = new HiddenGemRepository();
export { hiddenGemRepository };
