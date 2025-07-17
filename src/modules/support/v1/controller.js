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

  // In controller.js - add this method to the SupportController class
   async addSolutionToTicket(req, res) {
    try {
      const ticketId = parseInt(req.params.id, 10);
      const { resolution } = req.body;
      const adminId = req.user.id;

      const updatedTicket = await supportService.addSolutionToTicket(
        ticketId,
        resolution,
        adminId
      );

      res.status(200).json({
        success: true,
        message: "Solution added successfully",
        data: updatedTicket,
      });
    } catch (error) {
      console.error("Error adding solution to ticket:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to add solution",
      });
    }
  }

}

export default new SupportController();
