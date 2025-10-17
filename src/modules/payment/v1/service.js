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

  async getSoldPackagesCount(){
    return this.paymentRepository.getSoldPackagesCount();
  }
  
  async getTopPerformerRevenue(){
    return this.paymentRepository.getTopPerformerRevenue();
  }

  async getTopSellingPackage(){
    return this.paymentRepository.getTopSellingPackage();
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
  async createStripPayment(paymentIntentData, userId) {
    console.log('createStripPayment service called with:', { paymentIntentData, userId });

    // Handle different data structures from mobile vs web
    let stripPaymentData;

    if (paymentIntentData.clientSecret && paymentIntentData.paymentIntentId) {
      // Mobile format
      stripPaymentData = {
        transaction_id: paymentIntentData.paymentIntentId,
        user_id: parseInt(userId),
        amount: paymentIntentData.amount ? paymentIntentData.amount / 100 : 0,
        status: paymentIntentData.status === "succeeded" ? 'completed' : 'pending',
        currency: paymentIntentData.currency || 'usd',
        paid_at: paymentIntentData.status === "succeeded" ? new Date() : null,
        invoice_number: paymentIntentData.paymentIntentId,
        package_id: paymentIntentData.metadata?.packageId ? parseInt(paymentIntentData.metadata.packageId) : null,
      };
    } else {
      // Web format - use paymentIntent directly
      stripPaymentData = {
        transaction_id: paymentIntentData.id,
        user_id: parseInt(userId),
        amount: paymentIntentData.amount / 100, // Convert from cents to dollars
        status: paymentIntentData.status === "succeeded" ? 'completed' : 'pending',
        currency: paymentIntentData.currency,
        paid_at: paymentIntentData.status === "succeeded" ? new Date(paymentIntentData.created * 1000) : null,
        invoice_number: paymentIntentData.id,
        package_id: paymentIntentData.metadata?.packageId ? parseInt(paymentIntentData.metadata.packageId) : null,
      };
    }

    console.log('Creating payment with data:', stripPaymentData);

    const payment = await this.paymentRepository.createStripPayment(stripPaymentData);
    console.log('Payment created in database:', payment);

    return payment; // Return the created payment record
  }

  async handlePaymentFailure(paymentIntent) {
    const { id, metadata } = paymentIntent;

    // Update payment status in database
    return await this.paymentRepository.updatePaymentStatus(id, 'failed');
  }

  async checkUserPaymentForPackage(userId, packageId) {
    try {
      console.log('Checking payment for user:', userId, 'package:', packageId);

      const payment = await prisma.payment.findFirst({
        where: {
          user_id: userId,
          package_id: packageId,
          status: 'completed'
        }
      });

      const hasPaid = payment !== null;
      console.log('Payment check result:', hasPaid);

      return hasPaid;
    } catch (error) {
      console.error('Error checking user payment for package:', error);
      return false;
    }
  }
}



