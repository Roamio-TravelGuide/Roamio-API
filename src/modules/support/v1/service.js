import { SupportRepository } from "./repository.js";

export class SupportService {
  constructor() {
    this.supportRepository = new SupportRepository();
  }

  async createSupportTicket(ticketData) {
    try {
      // Validate and process the ticket data
      const processedData = {
        user_id: ticketData.user_id,
        user_type: ticketData.user_type,
        travel_guide_id:
          ticketData.user_type === "travel_guide"
            ? ticketData.travel_guide_id
            : null,
        vendor_id:
          ticketData.user_type === "vendor" ? ticketData.vendor_id : null,
        category: ticketData.category,
        subject: ticketData.subject,
        description: ticketData.description,
        urgency: ticketData.urgency || "medium",
        status: "open",
        opened_at: new Date(),
      };

      return await this.supportRepository.createTicket(processedData);
    } catch (error) {
      console.error("Error creating support ticket:", error);
      throw new Error("Failed to create support ticket");
    }
  }

  async getUserTickets(userId, userType, filterOptions = {}) {
    try {
      const filters = {
        user_id: userId,
        user_type: userType,
        status: filterOptions.status,
        category: filterOptions.category,
        page: filterOptions.page || 1,
        limit: filterOptions.limit || 10,
        sortBy: filterOptions.sortBy || "created_at",
        sortOrder: filterOptions.sortOrder || "desc",
      };

      return await this.supportRepository.getUserTickets(filters);
    } catch (error) {
      console.error("Error fetching user tickets:", error);
      throw new Error("Failed to fetch support tickets");
    }
  }

  async getTicketById(ticketId, userId, userType) {
    try {
      const ticket = await this.supportRepository.getTicketById(ticketId);

      // Ensure user can only access their own tickets
      if (
        !ticket ||
        ticket.user_id !== userId ||
        ticket.user_type !== userType
      ) {
        throw new Error("Ticket not found or access denied");
      }

      return ticket;
    } catch (error) {
      console.error("Error fetching ticket:", error);
import { supportRepository } from './repository.js';

class SupportService {
  async getSupportTickets(filters = {}) {
    try {
      return await supportRepository.findMany(filters);
    } catch (error) {
      console.error('Error in getSupportTickets service:', error);
      throw error;
    }
  }

  async getSupportTicketById(id) {
    try {
      const ticket = await supportRepository.findById(id);

      if (!ticket) {
        return null;
      }

      return ticket;
    } catch (error) {
      console.error('Error in getSupportTicketById service:', error);
      throw error;
    }
  }

  async createSupportTicket(ticketData) {
    try {
      return await supportRepository.create(ticketData);
    } catch (error) {
      console.error('Error in createSupportTicket service:', error);
      throw error;
    }
  }

  async updateTicketStatus(id, statusData) {
    try {
      return await supportRepository.updateStatus(id, statusData);
    } catch (error) {
      if (error.code === 'P2025') return null;
      console.error('Error in updateTicketStatus service:', error);
      throw error;
    }
  }

  async updateTicket(ticketId, userId, userType, updateData) {
    try {
      // Verify ticket ownership
      const existingTicket = await this.getTicketById(
        ticketId,
        userId,
        userType
      );

      // Only allow certain fields to be updated by users
      const allowedUpdates = {
        description: updateData.description,
        urgency: updateData.urgency,
      };

      // Remove undefined values
      Object.keys(allowedUpdates).forEach(
        (key) => allowedUpdates[key] === undefined && delete allowedUpdates[key]
      );

      if (Object.keys(allowedUpdates).length === 0) {
        throw new Error("No valid updates provided");
      }

      return await this.supportRepository.updateTicket(
        ticketId,
        allowedUpdates
      );
    } catch (error) {
      console.error("Error updating ticket:", error);
  async getTicketStatistics(userType = null) {
    try {
      return await supportRepository.getStatistics(userType);
    } catch (error) {
      console.error('Error in getTicketStatistics service:', error);
      throw error;
    }
  }

  async getTicketsByUserId(userId, filters = {}) {
    try {
      if (!userId || isNaN(userId)) {
        throw new Error('Invalid user ID');
      }

      const result = await supportRepository.findByUserId(userId, filters);

      return {
        tickets: result.tickets,
        total: result.total,
        page: filters.page || 1,
        limit: filters.limit || 10
      };
    } catch (error) {
      console.error('Error in getTicketsByUserId service:', error);
      throw error;
    }
  }

  async getAllTickets(filterOptions = {}) {
    try {
      // This method is for admin use
      const filters = {
        status: filterOptions.status,
        category: filterOptions.category,
        user_type: filterOptions.user_type,
        urgency: filterOptions.urgency,
        search: filterOptions.search,
        page: filterOptions.page || 1,
        limit: filterOptions.limit || 20,
        sortBy: filterOptions.sortBy || "created_at",
        sortOrder: filterOptions.sortOrder || "desc",
      };

      return await this.supportRepository.getAllTickets(filters);
    } catch (error) {
      console.error("Error fetching all tickets:", error);
      throw new Error("Failed to fetch support tickets");
    }
  }

  async updateTicketStatus(ticketId, status, resolution = null, adminId) {
    try {
      const updateData = {
        status,
        resolution,
        resolved_at: status === "resolved" ? new Date() : null,
        updated_at: new Date(),
      };

      return await this.supportRepository.updateTicket(ticketId, updateData);
    } catch (error) {
      console.error("Error updating ticket status:", error);
      throw new Error("Failed to update ticket status");
    }
  }

  async getTicketStats(userType = null) {
    try {
      return await this.supportRepository.getTicketStats(userType);
    } catch (error) {
      console.error("Error fetching ticket stats:", error);
      throw new Error("Failed to fetch ticket statistics");
    }
  }
}
  async addAdminResponse(id, responseData) {
    try {
      return await supportRepository.updateStatus(id, responseData);
    } catch (error) {
      if (error.code === 'P2025') return null;
      console.error('Error in addAdminResponse service:', error);
      throw error;
    }
  }

  // Helper methods
  async getTicketsByCategoryStatistics(userType = null) {
    try {
      const stats = await supportRepository.getStatistics(userType);
      return stats.byCategory;
    } catch (error) {
      console.error('Error in getTicketsByCategoryStatistics service:', error);
      throw error;
    }
  }

  async getUrgentTickets(userType = null) {
    try {
      return await supportRepository.findMany({
        urgency: 'high',
        status: ['open', 'in_progress'],
        user_type: userType,
        limit: 20
      });
    } catch (error) {
      console.error('Error in getUrgentTickets service:', error);
      throw error;
    }
  }
}

export default new SupportService();
