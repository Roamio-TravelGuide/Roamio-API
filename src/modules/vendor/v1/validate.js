import { body } from 'express-validator';

export const validateUpdateVendorProfile = [
    body('businessName')
        .notEmpty().withMessage('Business name is required')
        .isLength({ max: 100 }).withMessage('Business name must be less than 100 characters'),
    
    body('description')
        .optional()
        .isString().withMessage('Description must be a string')
        .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    
    body('email')
        .isEmail().withMessage('Invalid email address')
        .normalizeEmail(),
    
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

export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};