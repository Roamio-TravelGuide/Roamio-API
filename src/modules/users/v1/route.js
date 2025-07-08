import  { Router } from 'express';
import { UserController } from './controller';

const router = Router();
const userController = new UserController();

router.get('/', (req, res) => userController.getUsers(req, res));
router.patch('/:userId/status', (req, res) => userController.updateUserStatus(req, res));

module.exports = router;