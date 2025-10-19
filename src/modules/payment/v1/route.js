import { Router } from "express";
import { PaymentController } from "./controller.js";
import authenticate from "../../../middleware/auth.js";

const router = Router();
const paymentController = new PaymentController();
router.get("/revenue", (req, res) => paymentController.getRevenue(req, res));
router.get("/top-performer-revenue", (req, res) => paymentController.getTopPerformerRevenue(req, res));
router.get("/top-selling-package", (req, res) => paymentController.getTopSellingPackage(req, res));
router.get("/sold-packages-count", (req, res) => paymentController.getSoldPackagesCount(req, res));


// Revenue route (keep auth if needed later)
router.get("/revenue", (req, res) =>
  paymentController.getRevenue(req, res)
);

// Authenticate to get user ID for metadata
router.post("/create-payment-intent", authenticate, (req, res) =>
  paymentController.createPaymentIntent(req, res)
);
// 🔹 TEMP: removed authenticate so you can test Stripe
router.post("/create-strip-payment", authenticate, (req, res) =>
    paymentController.createStripPayment(req, res)

);

// Record successful payment
router.post("/record-success", (req, res) =>
    paymentController.recordPaymentSuccess(req, res)
);

// Confirm payment intent with payment method
router.post("/confirm-payment", authenticate, (req, res) =>
    paymentController.confirmPaymentIntent(req, res)
);

// Webhook (Stripe doesn't use auth)
/*
router.post("/webhook", (req, res) =>
  paymentController.handleWebhook(req, res)
);
*/
export default router;
