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