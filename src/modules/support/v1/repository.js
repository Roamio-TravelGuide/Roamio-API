import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class SupportRepository {
  async createTicket(ticketData) {
    try {
      return await prisma.supportTicket.create({
        data: ticketData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          travel_guide: {
            select: {
              id: true,
              verification_documents: true,
              languages_spoken: true,
              years_of_experience: true,
            },
          },
          vendor: {
            select: {
              id: true,
              business_name: true,
              business_type: true,
              verification_status: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error creating ticket in database:", error);
      throw error;
    }
  }

  async getUserTickets(filters) {
    try {
      const { page, limit, sortBy, sortOrder, ...whereFilters } = filters;

      // Remove undefined values from where clause
      Object.keys(whereFilters).forEach(
        (key) => whereFilters[key] === undefined && delete whereFilters[key]
      );

      const skip = (page - 1) * limit;

      const [tickets, totalCount] = await Promise.all([
        prisma.supportTicket.findMany({
          where: whereFilters,
          skip,
          take: limit,
          orderBy: {
            [sortBy]: sortOrder,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        }),
        prisma.supportTicket.count({
          where: whereFilters,
        }),
      ]);

      return {
        tickets,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      console.error("Error fetching user tickets:", error);
      throw error;
    }
  }

  async getTicketById(ticketId) {
    try {
      return await prisma.supportTicket.findUnique({
        where: { id: parseInt(ticketId) },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          travel_guide: {
            select: {
              id: true,
              verification_documents: true,
              languages_spoken: true,
              years_of_experience: true,
            },
          },
          vendor: {
            select: {
              id: true,
              business_name: true,
              business_type: true,
              verification_status: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error fetching ticket by ID:", error);
      throw error;
    }
  }

  async updateTicket(ticketId, updateData) {
    try {
      return await prisma.supportTicket.update({
        where: { id: parseInt(ticketId) },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error updating ticket:", error);
      throw error;
    }
  }

  async getAllTickets(filters) {
    try {
      const { page, limit, sortBy, sortOrder, search, ...whereFilters } =
        filters;

      // Build where clause
      const whereClause = {
        ...whereFilters,
      };

      // Remove undefined values
      Object.keys(whereClause).forEach(
        (key) => whereClause[key] === undefined && delete whereClause[key]
      );

      // Add search functionality
      if (search) {
        whereClause.OR = [
          { subject: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          {
            user: {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ];
      }

      const skip = (page - 1) * limit;

      const [tickets, totalCount] = await Promise.all([
        prisma.supportTicket.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: {
            [sortBy]: sortOrder,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            travel_guide: {
              select: {
                id: true,
                verification_documents: true,
                languages_spoken: true,
              },
            },
            vendor: {
              select: {
                id: true,
                business_name: true,
                business_type: true,
              },
            },
          },
        }),
        prisma.supportTicket.count({
          where: whereClause,
        }),
      ]);

      return {
        tickets,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      };
    } catch (error) {
      console.error("Error fetching all tickets:", error);
      throw error;
    }
  }

  async getTicketStats(userType = null) {
    try {
      const whereClause = userType ? { user_type: userType } : {};

      const [
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        rejectedTickets,
        categoryStats,
        urgencyStats,
      ] = await Promise.all([
        prisma.supportTicket.count({ where: whereClause }),
        prisma.supportTicket.count({
          where: { ...whereClause, status: "open" },
        }),
        prisma.supportTicket.count({
          where: { ...whereClause, status: "in_progress" },
        }),
        prisma.supportTicket.count({
          where: { ...whereClause, status: "resolved" },
        }),
        prisma.supportTicket.count({
          where: { ...whereClause, status: "rejected" },
        }),
        prisma.supportTicket.groupBy({
          by: ["category"],
          where: whereClause,
          _count: true,
        }),
        prisma.supportTicket.groupBy({
          by: ["urgency"],
          where: whereClause,
          _count: true,
        }),
      ]);

      return {
        total: totalTickets,
        byStatus: {
          open: openTickets,
          in_progress: inProgressTickets,
          resolved: resolvedTickets,
          rejected: rejectedTickets,
        },
        byCategory: categoryStats.reduce((acc, item) => {
          acc[item.category] = item._count;
          return acc;
        }, {}),
        byUrgency: urgencyStats.reduce((acc, item) => {
          acc[item.urgency] = item._count;
          return acc;
        }, {}),
      };
    } catch (error) {
      console.error("Error fetching ticket stats:", error);
      throw error;
    }
  }

  async addsolution(ticketId, resolutionData) {
    return await prisma.supportTicket.update({
      where: { id: parseInt(ticketId) },
      data: {
        resolution: resolutionData,
        status: "resolved",
        resolved_at: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}