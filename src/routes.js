import { Router } from "express";
import authRoutes from "./modules/auth/v1/route.js";
import tourPackageRoutes from "./modules/tour-package/v1/route.js";
import vendorRoutes from "./modules/vendor/v1/route.js";
import supportRoutes from "./modules/support/v1/route.js";
import poiRoutes from "./modules/poi/v1/route.js";
import paymentRoutes from "./modules/payment/v1/route.js";
import userRoutes from "./modules/users/v1/route.js";
import storageRoutes from "./modules/storage/v1/route.js";
import hiddenGemRoutes from "./modules/hiddenGem/v1/route.js";
import travellerRoutes from "./modules/traveller/route.js";
import packageRoutes from "./modules/packages/route.js";

const router = Router();

router.get("/", (req, res) => {
  console.log("GET /api/v1 hit");
  res.send("API v1 is working");
});

router.use("/auth", authRoutes);
router.use("/tour-package", tourPackageRoutes);
router.use("/users", userRoutes);

router.use("/storage", storageRoutes);
router.use("/vendor", vendorRoutes);
router.use("/support", supportRoutes);
router.use("/support", supportRoutes);

router.use("/poi", poiRoutes);
router.use("/hiddenGem", hiddenGemRoutes);
router.use("/traveller", travellerRoutes);

router.use("/packages", packageRoutes);

// Add route for getting individual package by ID
router.get('/packages/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
    }

    const tourPackageService = (await import('./modules/tour-package/v1/service.js')).default;
    const tourPackage = await tourPackageService.getTourPackageById(parseInt(id));

    if (!tourPackage) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: tourPackage,
    });
  } catch (error) {
    console.error("Error fetching package:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Add route for checking payment status for a package
router.get('/packages/:id/payment-status', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId; // Get userId from query parameter instead of auth

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid package ID",
      });
    }

    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const paymentService = (await import('./modules/payment/v1/service.js')).default;
    const hasPaid = await paymentService.checkUserPaymentForPackage(parseInt(userId), parseInt(id));

    return res.status(200).json({
      success: true,
      data: {
        hasPaid: hasPaid,
        packageId: parseInt(id),
        userId: parseInt(userId),
      },
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});
router.use("/payment", paymentRoutes);

export default router;
