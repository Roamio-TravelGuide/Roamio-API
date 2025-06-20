import { Router } from 'express';
import authRoutes from './modules/web/routes/authRoutes';

const router = Router();

router.use('/auth', authRoutes);

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

export default router;