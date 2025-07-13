import { body, param, query, validationResult } from 'express-validator';

export const validateSupportFilters = [
  query('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']),
  query('category').optional().isIn([
    // Travel Guide categories
    'safety', 'harassment', 'workplace', 'payment', 'equipment', 
    'management', 'customer', 'scheduling', 'training',
    // Vendor categories  
    'technical', 'account', 'billing', 'feature_request', 'bug_report',
    // Common
    'other'
  ]),
  query('urgency').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('user_type').optional().isIn(['TRAVEL_GUIDE', 'VENDOR']),
  query('search').optional().isLength({ min: 1, max: 100 }),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
];

export const validateSupportTicketId = [
  param('id').isInt({ min: 1 }).withMessage('Invalid support ticket ID')
];

export const validateCreateSupportTicket = [
  body('category').isIn([
    'safety', 'harassment', 'workplace', 'payment', 'equipment', 
    'management', 'customer', 'scheduling', 'training',
    'technical', 'account', 'billing', 'feature_request', 'bug_report',
    'other'
  ]).withMessage('Invalid support category'),
  body('subject').trim().isLength({ min: 5, max: 200 }).withMessage('Subject must be between 5 and 200 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('urgency').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid urgency level'),
  body('user_id').isInt({ min: 1 }).withMessage('Valid user ID is required'),
  body('user_type').isIn(['TRAVEL_GUIDE', 'VENDOR']).withMessage('Valid user type is required'),
  body('travel_guide_id').optional().isInt({ min: 1 }).withMessage('Valid travel guide ID required'),
  body('vendor_id').optional().isInt({ min: 1 }).withMessage('Valid vendor ID required')
];

export const validateUpdateStatus = [
  ...validateSupportTicketId,
  body('status').isIn(['open', 'in_progress', 'resolved', 'closed']).withMessage('Invalid status'),
  body('resolution').optional().trim().isLength({ min: 1, max: 1000 }).withMessage('Resolution must be between 1 and 1000 characters'),
  body('admin_id').optional().isInt({ min: 1 }).withMessage('Valid admin ID is required')
];

export const validateAdminResponse = [
  ...validateSupportTicketId,
  body('resolution').trim().isLength({ min: 1, max: 1000 }).withMessage('Resolution must be between 1 and 1000 characters'),
  body('admin_id').isInt({ min: 1 }).withMessage('Valid admin ID is required')
];

export const validateUserId = [
  param('userId').isInt({ min: 1 }).withMessage('Invalid user ID')
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};