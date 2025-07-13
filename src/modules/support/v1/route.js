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