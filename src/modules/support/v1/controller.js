import supportService from './service.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class SupportController {
  async getSupportTickets(req, res) {
    try {
      const filters = {
        status: req.query.status,
        category: req.query.category,
        urgency: req.query.urgency,
        user_type: req.query.user_type, // 'TRAVEL_GUIDE' or 'VENDOR'
        search: req.query.search,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 10
      };

      const result = await supportService.getSupportTickets(filters);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getSupportTicketById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        res.status(400).json({
          success: false,
          message: 'Invalid support ticket ID'
        });
        return;
      }

      const ticket = await supportService.getSupportTicketById(parseInt(id));
      
      if (!ticket) {
        res.status(404).json({
          success: false,
          message: 'Support ticket not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: ticket
      });
    } catch (error) {
      console.error('Error fetching support ticket:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async createSupportTicket(req, res) {
    try {
      const { 
        type,
        subject, 
        message,
        urgency, 
        user_id, 
        user_type,
        travel_guide_id,
        vendor_id 
      } = req.body;

      // Add detailed logging
      console.log('Received support ticket data:', {
        type,
        subject, 
        message,
        urgency, 
        user_id, 
        user_type,
        travel_guide_id,
        vendor_id
      });

      if (!type || !subject || !message || !user_id || !user_type) {
        console.log('Validation failed - missing required fields');
        return res.status(400).json({ 
          success: false,
          message: 'Type, subject, message, user_id, and user_type are required' 
        });
      }

      // Validate user_type specific requirements
      if (user_type === 'TRAVEL_GUIDE' && !travel_guide_id) {
        console.log('Validation failed - missing travel_guide_id');
        return res.status(400).json({
          success: false,
          message: 'travel_guide_id is required for travel guide tickets'
        });
      }

      if (user_type === 'VENDOR' && !vendor_id) {
        console.log('Validation failed - missing vendor_id');
        return res.status(400).json({
          success: false,
          message: 'vendor_id is required for vendor tickets'
        });
      }

      const ticketData = {
        category: type, // Map frontend 'type' to backend 'category'
        subject,
        description: message, // Map frontend 'message' to backend 'description'
        urgency: urgency || 'medium',
        user_id: parseInt(user_id),
        user_type,
        travel_guide_id: travel_guide_id ? parseInt(travel_guide_id) : null,
        vendor_id: vendor_id ? parseInt(vendor_id) : null,
        status: 'open' // This should match your ReportStatus enum
      };

      console.log('Processed ticket data:', ticketData);

      const result = await supportService.createSupportTicket(ticketData);

      console.log('Service result:', result);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Support ticket submitted successfully'
      });

    } catch (error) {
      console.error('Support ticket creation failed:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        success: false,
        message: error.message || 'Failed to create support ticket'
      });
    }
  }

  async updateTicketStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, resolution, admin_id } = req.body;

      if (!id || isNaN(parseInt(id))) {
        res.status(400).json({
          success: false,
          message: 'Invalid support ticket ID'
        });
        return;
      }

      if (!status || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Status must be one of: open, in_progress, resolved, closed'
        });
        return;
      }

      const updateData = {
        status,
        resolution: resolution || null,
        admin_id: admin_id ? parseInt(admin_id) : null
      };

      const updatedTicket = await supportService.updateTicketStatus(parseInt(id), updateData);
      
      if (!updatedTicket) {
        res.status(404).json({
          success: false,
          message: 'Support ticket not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Support ticket status updated successfully',
        data: updatedTicket
      });
    } catch (error) {
      console.error('Error updating support ticket status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getTicketStatistics(req, res) {
    try {
      const { user_type } = req.query;
      const statistics = await supportService.getTicketStatistics(user_type);

      res.status(200).json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Error fetching support ticket statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getTicketsByUserId(req, res) {
    try {
      const { userId } = req.params;
      const { status, category, page = 1, limit = 10 } = req.query;

      if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }

      const filters = {
        status,
        category,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await supportService.getTicketsByUserId(parseInt(userId), filters);

      res.status(200).json({
        success: true,
        data: result.tickets,
        total: result.total,
        page: result.page,
        limit: result.limit
      });
    } catch (error) {
      console.error('Error fetching support tickets by user:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async addAdminResponse(req, res) {
    try {
      const { id } = req.params;
      const { resolution, admin_id } = req.body;

      if (!id || isNaN(parseInt(id))) {
        res.status(400).json({
          success: false,
          message: 'Invalid support ticket ID'
        });
        return;
      }

      if (!resolution || !admin_id) {
        res.status(400).json({
          success: false,
          message: 'Resolution and admin_id are required'
        });
        return;
      }

      const result = await supportService.addAdminResponse(parseInt(id), {
        resolution,
        admin_id: parseInt(admin_id),
        status: 'in_progress'
      });

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Support ticket not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Admin response added successfully',
        data: result
      });
    } catch (error) {
      console.error('Error adding admin response:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export default new SupportController();