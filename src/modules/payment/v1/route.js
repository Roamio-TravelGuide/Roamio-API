import { Router } from "express";
import { PaymentController } from "./controller.js";
import authenticate from "../../../middleware/auth.js";

const router = Router();
const paymentController = new PaymentController();

// Revenue route (keep auth if needed later)
router.get("/revenue", (req, res) =>
  paymentController.getRevenue(req, res)
);

// 🔹 TEMP: removed authenticate so you can test Stripe
router.post("/create-payment-intent", (req, res) =>
  paymentController.createPaymentIntent(req, res)
);

// Webhook (Stripe doesn't use auth)
router.post("/webhook", (req, res) =>
  paymentController.handleWebhook(req, res)
);

export default router;
