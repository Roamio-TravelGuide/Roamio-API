import { Router } from "express";
import {PaymentController}  from "./controller.js";

const router = Router();
const paymentController = new PaymentController();
router.get('/revenue', (req, res) => paymentController.getRevenue(req, res));

export default router;