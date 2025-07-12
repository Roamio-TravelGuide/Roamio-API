import { body } from 'express-validator';

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
  ]
};

function validate(method) {
  return authValidations[method];
}

export { authValidations, validate };