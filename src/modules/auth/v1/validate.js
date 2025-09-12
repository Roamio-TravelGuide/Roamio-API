import { body } from 'express-validator';
import Joi from 'joi';

const authValidations = {
  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ],
  
  signup: [
    body('name').notEmpty(),
    body('role').isIn(['traveler', 'travel_guide', 'vendor']),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('phone_no').isMobilePhone(),
  ],
  
  forgotPassword: [
    body('email').isEmail().normalizeEmail()
  ],
  
  resetPassword: [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ]
};

export { authValidations };