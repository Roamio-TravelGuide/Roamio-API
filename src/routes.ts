import { Router } from 'express';
import authRoutes from './modules/auth/v1/route';
import tourPackageRoutes from './modules/tour-package/v1/route'

const router = Router();


router.get('/', (req, res) => {
  console.log('GET /api/v1 hit');
  res.send('API v1 is working');
});

router.use('/auth', authRoutes);
router.use('/tour-packages', tourPackageRoutes);


router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

export default router;