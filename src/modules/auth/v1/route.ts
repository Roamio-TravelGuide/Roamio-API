import { Router } from 'express';
import { AuthController } from './controller';
import { authValidations } from './validate';
import { validateRequest } from '../../../middleware/validation';

const router = Router();

router.post(
  '/login',
  validateRequest(authValidations.login),
  AuthController.login
);

export default router;