import { PaymentRepository } from "./repository.js";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();

export class PaymentService {
  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  async getPayment(id) {
    const payment = await this.paymentRepository.getPayment(id);
    return payment;
  }

  async getTotalRevenue() {
    return this.paymentRepository.getTotalRevenue();
  }
  async ensureStripeCustomer(userId) {
    const vendor = await prisma.vendor.findUnique({
      where: { user_id: userId },
      include: { user: true },
    });

    if (!vendor) throw new Error("Vendor not found");

    if (!vendor.stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: vendor.user.email,
        name: vendor.business_name,
        metadata: { vendorId: vendor.id.toString(), userId: vendor.user_id.toString() },
      });

      await prisma.vendor.update({
        where: { id: vendor.id },
        data: { stripeCustomerId: customer.id },
      });

      return customer.id;
    }

    return vendor.stripeCustomerId;
  }

  async handlePaymentSuccess(paymentIntent) {
    const { id, amount, metadata } = paymentIntent;

    // Save payment to database
    const paymentData = {
      transaction_id: id,
      user_id: parseInt(metadata.userId), // Prisma expects user_id
      amount: amount / 100,
      status: 'succeeded',
      currency: paymentIntent.currency,
      payment_method: paymentIntent.payment_method_types[0],
      receipt_url: charge?.receipt_url || null,
      paid_at: new Date(),
      invoice_number: paymentIntent.invoice || null,
    };

    return await this.paymentRepository.createPayment(paymentData);
  }
  async createStripPayment(paymentIntentData) {
    // Use paymentIntent directly, do NOT destructure `data`
    const stripPaymentData = {
      transaction_id: paymentIntentData.id,
     
      user: { connect: { id: 1 } }, // <-- required, do NOT include userId,
      amount: paymentIntentData.amount,
      status: 'pending',
      currency: paymentIntentData.currency,
      
       paid_at: paymentIntentData.status === "succeeded" ? new Date(paymentIntentData.created * 1000) : null,
      invoice_number: paymentIntentData.id,

    };

    return await this.paymentRepository.createStripPayment(stripPaymentData);
  }

  async handlePaymentFailure(paymentIntent) {
    const { id, metadata } = paymentIntent;

    // Update payment status in database
    return await this.paymentRepository.updatePaymentStatus(id, 'failed');
  }
}