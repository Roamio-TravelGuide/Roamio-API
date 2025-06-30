import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateTourPackageFilters = [
  query('status')
    .optional()
    .isIn(['pending_approval', 'published', 'rejected'])
    .withMessage('Status must be one of: pending_approval, published, rejected'),
  
  query('search')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('location')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Location must be between 1 and 50 characters'),
  
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('dateFrom must be a valid date'),
  
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('dateTo must be a valid date'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

export const validateTourPackageId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Tour package ID must be a positive integer'),
];

export const validateUpdateStatus = [
  ...validateTourPackageId,
  body('status')
    .isIn(['published', 'rejected'])
    .withMessage('Status must be either published or rejected'),
  
  body('rejection_reason')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Rejection reason must be between 1 and 500 characters'),
];

export const validateCreateTourPackage = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be at least 0.01'),
  body('duration_minutes').isInt({ min: 1 }).withMessage('Duration must be at least 1 minute'),
  body('guide_id').isInt({ min: 1 }).withMessage('Invalid guide ID'),
  body('tour_stops').isArray({ min: 1 }).withMessage('At least one tour stop is required'),
  body('tour_stops.*.sequence_no').isInt({ min: 1 }).withMessage('Stop sequence must be at least 1'),
  body('tour_stops.*.stop_name').trim().isLength({ min: 2, max: 100 }).withMessage('Stop name must be 2-100 characters'),
  body('tour_stops.*.location').optional().isObject().withMessage('Location must be an object'),
  body('tour_stops.*.location.longitude').optional().isFloat().withMessage('Invalid longitude'),
  body('tour_stops.*.location.latitude').optional().isFloat().withMessage('Invalid latitude'),
  body('tour_stops.*.media').optional().isArray().withMessage('Media must be an array'),
  body('tour_stops.*.media.*.url').optional().isURL().withMessage('Invalid media URL'),
  body('tour_stops.*.media.*.media_type').optional().isIn(['image', 'audio']).withMessage('Invalid media type'),
  body('cover_image_url').optional().isURL().withMessage('Invalid cover image URL')
];

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
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