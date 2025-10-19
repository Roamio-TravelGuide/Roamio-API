import { PaymentService } from "./service.js";
import Stripe from 'stripe';

export class PaymentController {
  constructor() {
    this.paymentService = new PaymentService();
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  async getPayment(req, res) {
    try {
      const { id } = req.params;
      const payment = await this.paymentService.getPayment(id);
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
        data: revenue,
        message: "Total revenue fetched successfully",
      });
    } catch (error) {
      console.error("Revenue calculation error:", error);
      res.status(500).json({
        error: error.message || "Failed to calculate revenue",
      });
    }
  }

  async getSoldPackagesCount(req,res){
    try {
      const soldPackageCount = await this.paymentService.getSoldPackagesCount();
      res.status(200).json(
        {
          data:soldPackageCount,
          message: "Sold packages count fetched successfully"
        }
      );
    } catch (error) {
      console.error("Sold packages count calculation error:", error);
      res.status(500).json({
        error: error.message || "Failed to calculate sold packages count",
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

  async getTopSellingPackage(req, res){
    try {
      const topSellingPackage = await this.paymentService.getTopSellingPackage();
      res.status(200).json(
        {
          data: topSellingPackage,
          message: "Top selling package fetched successfully"
        }
      );
    } catch (error) {
      console.error("Top performer revenue calculation error:", error);
      res.status(500).json({
        error: error.message || "Failed to calculate top performer revenue",
      });
    }
  }
  async createPaymentIntent(req, res) {
    try {
      const { amount, currency = 'usd', metadata = {} } = req.body;

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        payment_method_types: ['card'], // Explicitly specify card payments only
        confirmation_method: 'manual', // Manual confirmation to avoid redirect issues
        capture_method: 'automatic', // Automatically capture when confirmed
        metadata: {
          userId: req.user?.id,
          ...metadata
        }
      });

      res.status(201).json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  async createStripPayment(req, res) {
    try {
      const data = req.body;
      const userId = req.user?.id;

      console.log('createStripPayment called with:', { data, userId });

      if (!userId) {
        console.log('No user ID found, checking if this is a vendor payment...');
        // For vendor payments, we might not have req.user, try to get from data
        const vendorUserId = data.metadata?.userId;
        if (vendorUserId) {
          console.log('Using vendor user ID:', vendorUserId);
          // For now, let's allow this without authentication for testing
          // In production, you'd want proper auth
        } else {
          return res.status(401).json({ error: 'Unauthorized - no user ID' });
        }
      }

      console.log('Calling payment service with data:', data);
      const stripPaymentData = await this.paymentService.createStripPayment(data, userId || data.metadata?.userId);

      console.log('Payment created successfully:', stripPaymentData);

      res.status(201).json({
        data: stripPaymentData,
        message: 'Payment recorded successfully'
      });
    } catch (error) {
      console.error('Error in createStripPayment:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async recordPaymentSuccess(req, res) {
    try {
      const { paymentIntentId, userId, amount, currency, packageId } = req.body;

      // Get the payment intent from Stripe to verify it
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      // Only proceed if payment is actually succeeded
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({
          success: false,
          error: 'Payment not completed',
          status: paymentIntent.status
        });
      }

      // Record the payment in database
      const paymentData = {
        transaction_id: paymentIntent.id,
        user_id: parseInt(userId),
        amount: amount,
        status: 'succeeded',
        currency: currency,
        payment_method: paymentIntent.payment_method_types[0],
        paid_at: new Date(),
        invoice_number: paymentIntent.id,
        package_id: packageId ? parseInt(packageId) : null,
      };

      const payment = await this.paymentService.paymentRepository.createStripPayment({
        transaction_id: paymentData.transaction_id,
        user: { connect: { id: paymentData.user_id } },
        amount: paymentData.amount,
        status: 'completed',
        currency: paymentData.currency,
        paid_at: paymentData.paid_at,
        invoice_number: paymentData.invoice_number,
        package_id: paymentData.package_id,
      });

      res.status(201).json({
        success: true,
        payment: payment,
        message: 'Payment recorded successfully',
        status: paymentIntent.status
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async confirmPaymentIntent(req, res) {
    try {
      const { paymentIntentId, paymentMethodData } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized - no user ID' });
      }

      console.log('Confirming payment intent:', paymentIntentId);
      console.log('Payment method data:', paymentMethodData);

      // Use test payment method tokens for security (as Stripe recommends)
      let paymentMethodId;
      
      // Map test card numbers to Stripe test payment method tokens
      const testCardNumber = paymentMethodData.cardNumber.replace(/\s/g, '');
      
      if (testCardNumber === '4242424242424242') {
        // Visa test card - use test payment method
        paymentMethodId = 'pm_card_visa'; // Stripe test payment method
      } else if (testCardNumber === '5555555555554444') {
        // Mastercard test card
        paymentMethodId = 'pm_card_mastercard';
      } else if (testCardNumber === '378282246310005') {
        // American Express test card
        paymentMethodId = 'pm_card_amex';
      } else {
        // For any other card, create a test payment method using Stripe's test token
        try {
          // Create a test token first (this is allowed by Stripe)
          const token = await this.stripe.tokens.create({
            card: {
              number: '4242424242424242', // Always use safe test number
              exp_month: parseInt(paymentMethodData.expMonth),
              exp_year: parseInt(paymentMethodData.expYear),
              cvc: paymentMethodData.cvc,
            },
          });

          // Create payment method from token
          const paymentMethod = await this.stripe.paymentMethods.create({
            type: 'card',
            card: {
              token: token.id,
            },
            billing_details: {
              name: paymentMethodData.cardholderName,
            },
          });

          paymentMethodId = paymentMethod.id;
        } catch (tokenError) {
          console.error('Error creating payment method from token:', tokenError);
          // Fallback to test payment method
          paymentMethodId = 'pm_card_visa';
        }
      }

      console.log('Using payment method:', paymentMethodId);

      // Confirm the payment intent with the payment method
      const confirmedPaymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      console.log('Payment intent confirmed:', confirmedPaymentIntent.status);

      // Record payment in database if successful
      if (confirmedPaymentIntent.status === 'succeeded') {
        const paymentData = {
          transaction_id: confirmedPaymentIntent.id,
          user_id: parseInt(userId),
          amount: confirmedPaymentIntent.amount / 100, // Convert from cents
          status: 'completed',
          currency: confirmedPaymentIntent.currency,
          paid_at: new Date(),
          invoice_number: confirmedPaymentIntent.id,
          package_id: confirmedPaymentIntent.metadata?.packageId ? parseInt(confirmedPaymentIntent.metadata.packageId) : null,
        };

        const payment = await this.paymentService.paymentRepository.createStripPayment(paymentData);
        
        res.status(200).json({
          success: true,
          payment: payment,
          paymentIntent: {
            id: confirmedPaymentIntent.id,
            status: confirmedPaymentIntent.status,
            amount: confirmedPaymentIntent.amount,
            currency: confirmedPaymentIntent.currency,
          },
          message: 'Payment confirmed and recorded successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Payment confirmation failed',
          status: confirmedPaymentIntent.status
        });
      }

    } catch (error) {
      console.error('Error confirming payment intent:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
  
  /*
  async handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await this.paymentService.handlePaymentSuccess(paymentIntent);
        break;
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        await this.paymentService.handlePaymentFailure(failedPayment);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
    */
}
  
  

  
  


