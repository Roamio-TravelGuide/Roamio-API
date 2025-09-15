import { Router } from 'express';
import { UserController } from './controller.js';

const router = Router();
const userController = new UserController();

router.get('/', (req, res) => userController.getUsers(req, res));
router.patch('/:userId/status', (req, res) => userController.updateUserStatus(req, res));

router.get('/:userId', (req,res)=> userController.getGuideProfile(req,res));
router.get('/performance/:userId' , (req,res) => userController.getGuidePerformance(req,res));
router.get('/documents/:userId' , (req,res) => userController.getGuideDocuments(req,res));


export default router;