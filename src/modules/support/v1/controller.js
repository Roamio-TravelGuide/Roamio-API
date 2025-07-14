import { SupportService } from "./service.js";

const supportService = new SupportService();

class SupportController {
  // Create a new support ticket
  async createTicket(req, res) {
    try {
      const { category, subject, description, urgency } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Get additional IDs based on user role
      let travel_guide_id = null;
      let vendor_id = null;

      if (userRole === "travel_guide" && req.user.travel_guide) {
        travel_guide_id = req.user.travel_guide.id;
      } else if (userRole === "vendor" && req.user.vendor_profile) {
        vendor_id = req.user.vendor_profile.id;
      }

      const ticketData = {
        user_id: userId,
        user_type: userRole,
        travel_guide_id,
        vendor_id,
        category,
        subject,
        description,
        urgency: urgency || "medium",
      };

      const ticket = await supportService.createSupportTicket(ticketData);

      res.status(201).json({
        success: true,
        message: "Support ticket created successfully",
        data: ticket,
      });
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create support ticket",
      });
    }
  }

  // Get user's support tickets
  async getUserTickets(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      // Use validated query parameters if available, otherwise fall back to req.query
      const queryParams = req.validatedQuery || req.query;

      const filterOptions = {
        status: queryParams.status,
        category: queryParams.category,
        page: queryParams.page ? parseInt(queryParams.page) : 1,
        limit: queryParams.limit ? parseInt(queryParams.limit) : 10,
        sortBy: queryParams.sortBy || "created_at",
        sortOrder: queryParams.sortOrder || "desc",
      };

      const result = await supportService.getUserTickets(
        userId,
        userRole,
        filterOptions
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching user tickets:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch support tickets",
      });
    }
  }

  // Get a specific ticket by ID
  async getTicketById(req, res) {
    try {
      const ticketId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;

      const ticket = await supportService.getTicketById(
        ticketId,
        userId,
        userRole
      );

      res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      console.error("Error fetching ticket:", error);
      const statusCode =
        error.message.includes("not found") ||
        error.message.includes("access denied")
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to fetch ticket",
      });
    }
  }

  // Update a support ticket (limited fields for users)
  async updateTicket(req, res) {
    try {
      const ticketId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;
      const { description, urgency } = req.body;

      const updateData = { description, urgency };
      const ticket = await supportService.updateTicket(
        ticketId,
        userId,
        userRole,
        updateData
      );

      res.status(200).json({
        success: true,
        message: "Ticket updated successfully",
        data: ticket,
      });
    } catch (error) {
      console.error("Error updating ticket:", error);
      const statusCode =
        error.message.includes("not found") ||
        error.message.includes("access denied")
          ? 404
          : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || "Failed to update ticket",
      });
    }
  }

  // Admin only: Get all support tickets
  async getAllTickets(req, res) {
    try {
      const filterOptions = {
        status: req.query.status,
        category: req.query.category,
        user_type: req.query.user_type,
        urgency: req.query.urgency,
        search: req.query.search,
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 20,
        sortBy: req.query.sortBy || "created_at",
        sortOrder: req.query.sortOrder || "desc",
      };

      const result = await supportService.getAllTickets(filterOptions);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error fetching all tickets:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch support tickets",
      });
    }
  }

  // Admin only: Update ticket status and resolution
  async updateTicketStatus(req, res) {
    try {
      const ticketId = req.params.id;
      const { status, resolution } = req.body;
      const adminId = req.user.id;

      const ticket = await supportService.updateTicketStatus(
        ticketId,
        status,
        resolution,
        adminId
      );

      res.status(200).json({
        success: true,
        message: "Ticket status updated successfully",
        data: ticket,
      });
    } catch (error) {
      console.error("Error updating ticket status:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update ticket status",
      });
    }
  }

  // Get support ticket statistics
  async getTicketStats(req, res) {
    try {
      const userType = req.query.user_type;
      const stats = await supportService.getTicketStats(userType);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching ticket stats:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch ticket statistics",
      });
    }
  }

  // Get support categories based on user role
  async getSupportCategories(req, res) {
    try {
      const userRole = req.user?.role; // Handle case where user might not be authenticated

      let categories = [];

      if (userRole === "vendor") {
        categories = [
          {
            value: "account",
            label: "Account Help",
            description: "Account settings and profile issues",
          },
          {
            value: "technical",
            label: "Technical Issue",
            description: "App bugs and technical problems",
          },
          {
            value: "payment",
            label: "Payment Issues",
            description: "Billing and payment problems",
          },
          {
            value: "billing",
            label: "Billing",
            description: "Invoice and subscription issues",
          },
          {
            value: "feature_request",
            label: "Feature Request",
            description: "Suggest new features",
          },
          {
            value: "other",
            label: "Other",
            description: "Other issues not listed above",
          },
        ];
      } else if (userRole === "travel_guide") {
        categories = [
          {
            value: "safety",
            label: "Safety Concerns",
            description: "Workplace safety issues",
          },
          {
            value: "harassment",
            label: "Harassment/Discrimination",
            description: "Report inappropriate behavior",
          },
          {
            value: "workplace",
            label: "Workplace Conditions",
            description: "Working environment issues",
          },
          {
            value: "payment",
            label: "Payment Issues",
            description: "Payment delays or disputes",
          },
          {
            value: "equipment",
            label: "Equipment/Resources",
            description: "Equipment and resource problems",
          },
          {
            value: "management",
            label: "Management Issues",
            description: "Issues with management",
          },
          {
            value: "customer",
            label: "Customer Behavior",
            description: "Problematic customer interactions",
          },
          {
            value: "scheduling",
            label: "Scheduling Problems",
            description: "Schedule conflicts and issues",
          },
          {
            value: "training",
            label: "Training Issues",
            description: "Training and development needs",
          },
          {
            value: "technical",
            label: "Technical Issues",
            description: "App and platform problems",
          },
          {
            value: "feature_request",
            label: "Feature Request",
            description: "Suggest platform improvements",
          },
          {
            value: "other",
            label: "Other",
            description: "Other issues not listed above",
          },
        ];
      } else {
        // Default categories for other user types
        categories = [
          {
            value: "technical",
            label: "Technical Issue",
            description: "Technical problems and bugs",
          },
          {
            value: "account",
            label: "Account Help",
            description: "Account-related issues",
          },
          {
            value: "billing",
            label: "Billing",
            description: "Billing and payment issues",
          },
          {
            value: "feature_request",
            label: "Feature Request",
            description: "Suggest new features",
          },
          { value: "other", label: "Other", description: "Other issues" },
        ];
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
        data: {
          userRole,
          categories,
        },
      });
    } catch (error) {
      console.error("Error fetching support categories:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch support categories",
      });
    }
  }
}

export default new SupportController();
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
