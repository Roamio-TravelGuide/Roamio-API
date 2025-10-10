import { PrismaClient } from "@prisma/client";

export class UserRepository {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async getAllUsers(filterOptions) {
    try {
      const whereClause = {};

      if (filterOptions?.role) {
        whereClause.role = filterOptions.role;
      }

      if (filterOptions?.status) {
        whereClause.status = filterOptions.status;
      }

      if (filterOptions?.search) {
        whereClause.OR = [
          { name: { contains: filterOptions.search, mode: "insensitive" } },
          { email: { contains: filterOptions.search, mode: "insensitive" } },
        ];
      }

      const users = await this.prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          role: true,
          status: true,
          email: true,
          phone_no: true,
          name: true,
          registered_date: true,
          profile_picture_url: true,
          bio: true,
          last_login: true,
        },
        orderBy: {
          [filterOptions?.sortBy || "registered_date"]:
            filterOptions?.sortOrder || "desc",
        },
        skip:
          filterOptions?.page && filterOptions?.limit
            ? (filterOptions.page - 1) * filterOptions.limit
            : undefined,
        take: filterOptions?.limit,
      });

      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw new Error("Failed to fetch users");
    }
  }

  async updateUserStatus(userId, status) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { status },
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      throw new Error("Failed to update user status");
    }
  }

  async getGuideProfile(userId) {
    try {
      const guideProfile = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone_no: true,
          bio: true,
          profile_picture_url: true,
          last_login: true,
          status: true,
          guides: {
            select: {
              id: true,
              years_of_experience: true,
              languages_spoken: true,
              tour_packages: {
                select: {
                  id: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      return guideProfile;
    } catch (error) {
      console.error("Error fetching guide profile:", error);
      throw new Error("Failed to fetch guide profile");
    }
  }

  async getGuidePerformance(userId) {
    try {
      // Get tour packages count
      const toursConducted = await this.prisma.tourPackage.count({
        where: {
          guide_id: userId,
          status: "published",
        },
      });

      // Get reviews and calculate rating
      const reviews = await this.prisma.review.findMany({
        where: {
          package: {
            guide_id: userId,
          },
        },
        select: {
          rating: true,
        },
      });

      const rating =
        reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviews.length
          : 0;

      // Get total earnings
      const payments = await this.prisma.payment.findMany({
        where: {
          package: {
            guide_id: userId,
          },
          status: "completed",
        },
        select: {
          amount: true,
        },
      });

      const totalEarnings = payments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );

      // Calculate response rate (this would need more complex logic based on actual response data)
      const responseRate = 98; // Placeholder

      return {
        rating: parseFloat(rating.toFixed(1)),
        reviewsCount: reviews.length,
        toursConducted,
        totalEarnings,
        responseRate,
        avgResponseTime: 2, // Placeholder
      };
    } catch (error) {
      console.error("Error fetching guide performance:", error);
      throw new Error("Failed to fetch guide performance");
    }
  }

  async getGuideDocuments(userId) {
    try {
      // In your schema, documents are stored in the travel_guide table as verification_documents
      // This would need to be adjusted based on how you're actually storing documents
      const guide = await this.prisma.travelGuide.findUnique({
        where: { user_id: userId },
        select: {
          verification_documents: true,
        },
      });

      // Convert the documents string array to a structured format including the actual URL/path
      const documents =
        guide?.verification_documents.map((doc, index) => ({
          id: index,
          name: `Document ${index + 1}`,
          url: doc, // path stored in DB (e.g., /uploads/guideDocuments/xxxx.jpg)
          date: new Date().toISOString().split("T")[0],
          status: "Pending", // This would need actual verification logic
        })) || [];

      return documents;
    } catch (error) {
      console.error("Error fetching guide documents:", error);
      throw new Error("Failed to fetch guide documents");
    }
  }
}
