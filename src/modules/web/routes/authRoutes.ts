import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validate } from '../validations/authValidations';

const router = Router();

// POST /auth/login
router.post('/login', 
  validate('login'),
  AuthController.login
);

// POST /auth/logout
// router.post('/logout',
//   AuthController.authenticate,
//   AuthController.logout
// );

export default router;