import { body, param, query, validationResult } from 'express-validator';

export const validateTourPackageFilters = [
  query('status').optional().isIn(['pending_approval', 'published', 'rejected']),
  query('search').optional().isLength({ min: 1, max: 100 }),
  query('location').optional().isLength({ min: 1, max: 50 }),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
];

export const validateTourPackageId = [
  param('id').isInt({ min: 1 })
];

export const validateUpdateStatus = [
  ...validateTourPackageId,
  body('status').isIn(['published', 'rejected']),
  body('rejection_reason').optional().isLength({ min: 1, max: 500 })
];

export const validateCreateTourPackage = [
  body('title').trim().isLength({ min: 3, max: 200 }),
  body('description').optional().trim().isLength({ min: 10, max: 2000 }),
  body('price').isFloat({ min: 0.01 }),
  body('duration_minutes').isInt({ min: 1 }),
  body('guide_id').isInt({ min: 1 }),
  body('tour_stops').isArray({ min: 1 }),
  body('tour_stops.*.sequence_no').isInt({ min: 1 }),
  body('tour_stops.*.stop_name').trim().isLength({ min: 2, max: 100 }),
  body('tour_stops.*.location').optional().isObject(),
  body('tour_stops.*.location.longitude').optional().isFloat(),
  body('tour_stops.*.location.latitude').optional().isFloat(),
  body('cover_image_url').optional().isURL()
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