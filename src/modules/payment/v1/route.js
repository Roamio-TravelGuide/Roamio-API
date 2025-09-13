import { Router } from "express";
import { PaymentController } from "./controller.js";

const router = Router();
const paymentController = new PaymentController();
router.get("/revenue", (req, res) => paymentController.getRevenue(req, res));
router.get("/top-performer-revenue", (req, res) => paymentController.getTopPerformerRevenue(req, res));

export default router;
