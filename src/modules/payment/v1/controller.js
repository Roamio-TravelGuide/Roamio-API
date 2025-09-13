import { PaymentService } from "./service.js";

export class PaymentController {
  constructor() {
    this.paymentService = new PaymentService();
  }

  async getPayment(req, res) {
    try {
      const { id } = req.params;
      const payment = await this.paymentService.getPayment(id, this.prisma);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      res.status(200).json(payment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getRevenue(req, res) {
    try {
      const revenue = await this.paymentService.getTotalRevenue();
      res.status(200).json({
        data: revenue, // Keep the structure consistent
        message: "Total revenue fetched successfully",
      });
    } catch (error) {
      console.error("Revenue calculation error:", error);
      res.status(500).json({
        error: error.message || "Failed to calculate revenue",
      });
    }
  }

  async getTopPerformerRevenue(req, res){
    try {
      const topPerformerRevenue = await this.paymentService.getTopPerformerRevenue();
      res.status(200).json(
        {
          data: topPerformerRevenue,
          message: "Top performer revenue fetched successfully"
        }
      );
    } catch (error) {
      console.error("Top performer revenue calculation error:", error);
      res.status(500).json({
        error: error.message || "Failed to calculate top performer revenue",
      });
    }
  }
}
