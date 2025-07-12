import { Router } from 'express';
import { UserController } from './controller.js';

const router = Router();
const userController = new UserController();

router.get('/', (req, res) => userController.getUsers(req, res));
router.patch('/:userId/status', (req, res) => userController.updateUserStatus(req, res));

export default router;