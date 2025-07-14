import { Router } from "express";
import supportController from "./controller.js";
import {
  validateCreateTicket,
  validateUpdateTicket,
  validateUpdateTicketStatus,
  validateQueryParams,
  validateTicketId,
} from "./validate.js";
import authenticate from "../../../middleware/auth.js";
import { requireAdmin, optionalAuth } from "../../../middleware/roles.js";

const router = Router();

// Public routes
router.get("/categories", optionalAuth, supportController.getSupportCategories);

// User routes
router.post(
  "/tickets",
  authenticate,
  validateCreateTicket,
  supportController.createTicket
);
router.get(
  "/tickets",
  authenticate,
  validateQueryParams,
  supportController.getUserTickets
);
router.get(
  "/tickets/:id",
  authenticate,
  validateTicketId,
  supportController.getTicketById
);
router.put(
  "/tickets/:id",
  authenticate,
  validateTicketId,
  validateUpdateTicket,
  supportController.updateTicket
);

// Admin routes
router.get(
  "/admin/tickets",
  authenticate,
  validateQueryParams,
  requireAdmin,
  supportController.getAllTickets
);
router.put(
  "/admin/tickets/:id/status",
  authenticate,
  validateTicketId,
  validateUpdateTicketStatus,
  requireAdmin,
  supportController.updateTicketStatus
);
router.get(
  "/admin/stats",
  authenticate,
  validateQueryParams,
  requireAdmin,
  supportController.getTicketStats
);

export default router;
import { Router } from 'express';
import supportController from './controller.js';
import {
  validateSupportFilters,
  validateSupportTicketId,
  validateCreateSupportTicket,
  validateUpdateStatus,
  validateAdminResponse,
  handleValidationErrors
} from '../validators/supportValidator.js';

const router = Router();

// Get all support tickets (admin)
router.get('/',
  validateSupportFilters,
  handleValidationErrors,
  supportController.getSupportTickets
);

// Get support ticket statistics
router.get('/statistics',
  supportController.getTicketStatistics
);

// Get support tickets by user ID
router.get('/user/:userId',
  supportController.getTicketsByUserId
);

// Get single support ticket by ID
router.get('/:id',
  validateSupportTicketId,
  handleValidationErrors,
  supportController.getSupportTicketById
);

// Create new support ticket
router.post('/',
  validateCreateSupportTicket,
  handleValidationErrors,
  supportController.createSupportTicket
);

// Update support ticket status (admin)
router.patch('/:id/status',
  validateUpdateStatus,
  handleValidationErrors,
  supportController.updateTicketStatus
);

// Add admin response
router.patch('/:id/response',
  validateAdminResponse,
  handleValidationErrors,
  supportController.addAdminResponse
);

export default router;
