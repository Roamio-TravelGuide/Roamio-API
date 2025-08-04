import { Router } from 'express';
import authRoutes from './modules/auth/v1/route.js';
import tourPackageRoutes from './modules/tour-package/v1/route.js';
import vendorRoutes from './modules/vendor/v1/route.js';
import supportRoutes from './modules/support/v1/route.js';

import userRoutes from './modules/users/v1/route.js';
// import storageRoutes from './modules/storage/v1/route.js
// import userRoutes from './modules/users/v1/route.js';
import storageRoutes from './modules/storage/v1/route.js';

const router = Router();

router.get("/", (req, res) => {
  console.log("GET /api/v1 hit");
  res.send("API v1 is working");
});

router.use('/auth', authRoutes);
router.use('/tour-packages', tourPackageRoutes);
router.use('/users', userRoutes);
// router.use('/storage', storageRoutes);
// router.use('/users', userRoutes);
router.use('/storage', storageRoutes);
router.use('/vendor', vendorRoutes);
router.use('/support', supportRoutes);
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

export default router;