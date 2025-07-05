import { body } from 'express-validator';

const authValidations = {
  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ]
};

function validate(method) {
  return authValidations[method];
}

export { authValidations, validate };