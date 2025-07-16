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