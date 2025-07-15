import { body } from 'express-validator';

export const validateUpdateVendorProfile = (data) => {
  const errors = {};

  if (!data.businessName || data.businessName.trim().length === 0) {
    errors.businessName = 'Business name is required';
  } else if (data.businessName.length > 100) {
    errors.businessName = 'Business name must be less than 100 characters';
  }

  if (data.description && data.description.length > 1000) {
    errors.description = 'Description must be less than 1000 characters';
  }

  if (!data.email || !data.email.includes('@')) {
    errors.email = 'Valid email is required';
  }

  if (data.socialMedia?.website && 
      !data.socialMedia.website.startsWith('http')) {
    errors.website = 'Website must start with http:// or https://';
  }

  return errors;
};

export const vendorProfileValidationRules = [
  body('businessName')
    .notEmpty().withMessage('Business name is required')
    .isLength({ max: 100 }).withMessage('Business name must be less than 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  
  body('email')
    .isEmail().withMessage('Valid email is required'),
  
  body('phone')
    .optional()
    .isString().withMessage('Phone must be a string')
    .matches(/^\+?[0-9\s\-\(\)]{10,20}$/).withMessage('Invalid phone number format'),
  
  body('socialMedia')
    .optional()
    .isObject().withMessage('Social media must be an object'),
  
  body('socialMedia.instagram')
    .optional()
    .isString().withMessage('Instagram handle must be a string')
    .matches(/^[a-zA-Z0-9._]{1,30}$/).withMessage('Invalid Instagram handle'),
  
  body('socialMedia.facebook')
    .optional()
    .isString().withMessage('Facebook username must be a string')
    .matches(/^[a-zA-Z0-9.]{5,50}$/).withMessage('Invalid Facebook username'),
  
  body('socialMedia.website')
    .optional()
    .isURL().withMessage('Invalid website URL')
    .matches(/^https?:\/\//).withMessage('Website must start with http:// or https://')
];