import { Router } from 'express';
import authRoutes from './modules/auth/v1/route';

const router = Router();

router.use('/auth', authRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

export default router;