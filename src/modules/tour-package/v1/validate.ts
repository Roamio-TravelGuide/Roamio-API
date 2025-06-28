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
  body('title')
    .notEmpty()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be between 1 and 200 characters'),
  
  body('description')
    .notEmpty()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description is required and must be between 1 and 1000 characters'),
  
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
  
  body('duration_minutes')
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer (in minutes)'),
  
  body('guide_id')
    .isInt({ min: 1 })
    .withMessage('Guide ID must be a positive integer'),
];

// export const handleValidationErrors = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const errors = validationResult(req);
  
//   if (!errors.isEmpty()) {
//     return res.status(400).json({
//       success: false,
//       message: 'Validation failed',
//       errors: errors.array()
//     });
//   }
  
//   next();
// };