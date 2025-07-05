import { Router } from 'express';
import { AuthController } from './controller.js';
import { authValidations } from './validate.js';
import { validateRequest } from '../../../middleware/validation.js';

const router = Router();

router.post(
  '/login',
  validateRequest(authValidations.login),
  AuthController.login
);

export default router;