// authValidations.ts
import { body } from 'express-validator';

export const authValidations = {
  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ]
};

export function validate(method: keyof typeof authValidations) {
  return authValidations[method];
}