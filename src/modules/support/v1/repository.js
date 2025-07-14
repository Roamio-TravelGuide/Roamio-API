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
import prisma from '../../../database/connection.js';

class SupportRepository {
  async findMany(filters) {
    const { status, category, urgency, user_type, search, dateFrom, dateTo, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (urgency) where.urgency = urgency;
    if (user_type) where.user_type = user_type;

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) where.created_at.gte = new Date(dateFrom);
      if (dateTo) where.created_at.lte = new Date(dateTo);
    }

    const [tickets, total] = await Promise.all([
      prisma.support_ticket.findMany({
        where,
        include: {
          user: {
            select: { 
              id: true, 
              name: true, 
              email: true,
              phone_no: true
            }
          },
          travel_guide: {
            select: {
              id: true,
              verification_documents: true,
              languages_spoken: true,
              years_of_experience: true,
            },
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
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
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: [
          { urgency: 'desc' },
          { created_at: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.support_ticket.count({ where })
    ]);

    return { tickets, total, page, limit };
  }

  async findById(id) {
    return prisma.support_ticket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone_no: true,
            profile_picture_url: true
          }
        },
        travel_guide: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        vendor: {
          select: {
            id: true,
            business_name: true,
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
  }

  async create(data) {
    console.log('Repository create called with data:', data);
    
    if (!data.category || !data.subject || !data.description || !data.user_id) {
      console.log('Repository validation failed');
      throw new Error('Category, subject, description, and user_id are required');
    }

    // Validate user_type is a valid UserRole enum value
    const validUserTypes = ['TRAVEL_GUIDE', 'VENDOR', 'ADMIN', 'USER']; // Adjust based on your UserRole enum
    if (!validUserTypes.includes(data.user_type)) {
      throw new Error(`Invalid user_type: ${data.user_type}. Must be one of: ${validUserTypes.join(', ')}`);
    }

    // Validate category is a valid SupportCategory enum value
    const validCategories = [
      'safety', 'harassment', 'workplace', 'payment', 'equipment', 
      'management', 'customer', 'scheduling', 'training',
      'technical', 'account', 'billing', 'feature_request', 'bug_report', 'other'
    ];
    if (!validCategories.includes(data.category)) {
      throw new Error(`Invalid category: ${data.category}. Must be one of: ${validCategories.join(', ')}`);
    }

    // Validate urgency is a valid SupportUrgency enum value
    const validUrgencies = ['low', 'medium', 'high', 'critical'];
    if (data.urgency && !validUrgencies.includes(data.urgency)) {
      throw new Error(`Invalid urgency: ${data.urgency}. Must be one of: ${validUrgencies.join(', ')}`);
    }

    // Generate unique ticket ID
    const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    console.log('Generated ticket ID:', ticketId);

    const ticketData = {
      ticket_id: ticketId,
      category: data.category,
      subject: data.subject,
      description: data.description,
      urgency: data.urgency || 'medium',
      user_id: data.user_id,
      user_type: data.user_type,
      travel_guide_id: data.travel_guide_id || null,
      vendor_id: data.vendor_id || null,
      status: 'open',
      created_at: new Date(),
      updated_at: new Date()
    };

    console.log('Final ticket data for database:', ticketData);

    try {
      const ticket = await prisma.support_ticket.create({
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
              email: true
            }
          }
        }
      });

      console.log('Database insert successful:', ticket);

      return {
        success: true,
        data: ticket,
        message: 'Support ticket created successfully'
      };
    } catch (error) {
      console.error('Error creating support ticket:', error);
      console.error('Prisma error code:', error.code);
      console.error('Prisma error meta:', error.meta);
      
      if (error.code === 'P2003') {
        console.error('Foreign key constraint failed. Details:', error.meta);
        throw new Error(`Foreign key constraint failed: ${error.meta?.field_name || 'unknown field'}`);
      }
      
      if (error.code === 'P2002') {
        throw new Error('Duplicate ticket_id generated');
      }

      if (error.code === 'P2000') {
        throw new Error(`Database value too long for field: ${error.meta?.column_name || 'unknown'}`);
      }

      if (error.message.includes('Invalid enum value')) {
        throw new Error(`Invalid enum value in data: ${error.message}`);
      }
      
      throw new Error(`Failed to create support ticket: ${error.message}`);
    }
  }

  async updateStatus(id, updateData) {
    const data = {
      ...updateData,
      updated_at: new Date()
    };

    // Set resolved_at if status is resolved
    if (updateData.status === 'resolved') {
      data.resolved_at = new Date();
    }

    // Set closed_at if status is closed
    if (updateData.status === 'closed') {
      data.closed_at = new Date();
    }

    return prisma.support_ticket.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        travel_guide: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        vendor: {
          select: {
            id: true,
            business_name: true,
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
  }

  async getStatistics(userType = null) {
    const where = userType ? { user_type: userType } : {};

    const [openCount, inProgressCount, resolvedCount, closedCount, total, highUrgencyCount] = await Promise.all([
      prisma.support_ticket.count({ where: { ...where, status: 'open' } }),
      prisma.support_ticket.count({ where: { ...where, status: 'in_progress' } }),
      prisma.support_ticket.count({ where: { ...where, status: 'resolved' } }),
      prisma.support_ticket.count({ where: { ...where, status: 'closed' } }),
      prisma.support_ticket.count({ where }),
      prisma.support_ticket.count({ where: { ...where, urgency: 'high' } })
    ]);

    // Get tickets by category
    const categoryStats = await prisma.support_ticket.groupBy({
      by: ['category'],
      where,
      _count: {
        category: true
      }
    });

    // Get recent tickets (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCount = await prisma.support_ticket.count({
      where: {
        ...where,
        created_at: {
          gte: thirtyDaysAgo
        }
      }
    });

    return { 
      open: openCount, 
      inProgress: inProgressCount, 
      resolved: resolvedCount, 
      closed: closedCount, 
      total,
      highUrgency: highUrgencyCount,
      recent: recentCount,
      byCategory: categoryStats.reduce((acc, item) => {
        acc[item.category] = item._count.category;
        return acc;
      }, {})
    };
  }

  async findByUserId(userId, filters = {}) {
    try {
      const where = {
        user_id: userId
      };

      if (filters.status && filters.status !== 'all') {
        where.status = filters.status;
      }
      
      if (filters.category && filters.category !== 'all') {
        where.category = filters.category;
      }

      const [tickets, total] = await Promise.all([
        prisma.support_ticket.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip: (filters.page - 1) * filters.limit,
          take: filters.limit
        }),
        prisma.support_ticket.count({ where })
      ]);

      return { tickets, total };
    } catch (error) {
      console.error('findByUserId repository error:', error.message);
      throw error;
    }
  }
}

const supportRepository = new SupportRepository();
export { supportRepository };
