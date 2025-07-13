import { body } from 'express-validator';

export const validateVendorProfile = [
  body('businessName').notEmpty().withMessage('Business name is required'),
  body('email').isEmail().withMessage('Invalid email'),
  body('phone').optional().isMobilePhone(),
  body('address').optional().isString(),
  body('socialMedia.instagram').optional().isString(),
  body('socialMedia.facebook').optional().isString(),
  body('socialMedia.website').optional().isURL()
];