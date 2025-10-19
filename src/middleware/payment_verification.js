import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to verify if a user has paid for a specific package
 * This middleware checks the payment status before allowing access to package content
 */
export const verifyPackagePayment = async (req, res, next) => {
    try {
        const { packageId } = req.params;
        const userId = req.user?.id;

        console.log(`PaymentVerification: Checking payment for package ${packageId}, user ${userId}`);

        if (!packageId) {
            return res.status(400).json({
                success: false,
                message: 'Package ID is required'
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }

        // Check if user has completed payment for this package
        const payment = await prisma.payment.findFirst({
            where: {
                package_id: parseInt(packageId),
                user_id: userId,
                status: 'completed'
            }
        });

        if (!payment) {
            console.log(`PaymentVerification: No completed payment found for package ${packageId}, user ${userId}`);
            return res.status(403).json({
                success: false,
                message: 'Payment required to access this package',
                code: 'PAYMENT_REQUIRED',
                data: {
                    packageId: parseInt(packageId),
                    userId: userId,
                    hasPaid: false
                }
            });
        }

        console.log(`PaymentVerification: Payment verified for package ${packageId}, user ${userId}`);
        
        // Add payment info to request for use in subsequent handlers
        req.paymentInfo = {
            transactionId: payment.transaction_id,
            amount: payment.amount,
            currency: payment.currency,
            paidAt: payment.paid_at
        };

        next();
    } catch (error) {
        console.error('PaymentVerification middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during payment verification'
        });
    }
};

/**
 * Middleware to verify payment with optional bypass for preview mode
 * Allows limited access for unpaid users (preview mode)
 */
export const verifyPackagePaymentWithPreview = async (req, res, next) => {
    try {
        const { packageId } = req.params;
        const userId = req.user?.id;
        const { preview } = req.query;

        console.log(`PaymentVerificationWithPreview: Checking payment for package ${packageId}, user ${userId}, preview: ${preview}`);

        if (!packageId) {
            return res.status(400).json({
                success: false,
                message: 'Package ID is required'
            });
        }

        // If preview mode is requested, allow limited access without payment check
        if (preview === 'true') {
            console.log(`PaymentVerificationWithPreview: Preview mode enabled for package ${packageId}`);
            req.accessLevel = 'preview';
            req.maxStops = 2; // Limit to first 2 stops in preview
            next();
            return;
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required for full access'
            });
        }

        // Check payment status
        const payment = await prisma.payment.findFirst({
            where: {
                package_id: parseInt(packageId),
                user_id: userId,
                status: 'completed'
            }
        });

        if (payment) {
            console.log(`PaymentVerificationWithPreview: Full access granted for package ${packageId}, user ${userId}`);
            req.accessLevel = 'full';
            req.paymentInfo = {
                transactionId: payment.transaction_id,
                amount: payment.amount,
                currency: payment.currency,
                paidAt: payment.paid_at
            };
        } else {
            console.log(`PaymentVerificationWithPreview: Limited access for package ${packageId}, user ${userId}`);
            req.accessLevel = 'preview';
            req.maxStops = 2;
        }

        next();
    } catch (error) {
        console.error('PaymentVerificationWithPreview middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during payment verification'
        });
    }
};

/**
 * Helper function to check payment status (can be used in controllers)
 */
export const checkPaymentStatus = async (packageId, userId) => {
    try {
        const payment = await prisma.payment.findFirst({
            where: {
                package_id: parseInt(packageId),
                user_id: parseInt(userId),
                status: 'completed'
            },
            select: {
                transaction_id: true,
                amount: true,
                currency: true,
                paid_at: true,
                status: true
            }
        });

        return {
            hasPaid: payment !== null,
            paymentDetails: payment
        };
    } catch (error) {
        console.error('Error checking payment status:', error);
        throw error;
    }
};

/**
 * Middleware to add payment status to response without blocking access
 * Useful for endpoints that need to show different content based on payment status
 */
export const addPaymentStatus = async (req, res, next) => {
    try {
        const { packageId } = req.params;
        const userId = req.user?.id;

        if (packageId && userId) {
            const paymentStatus = await checkPaymentStatus(packageId, userId);
            req.paymentStatus = paymentStatus;
        }

        next();
    } catch (error) {
        console.error('AddPaymentStatus middleware error:', error);
        // Don't block the request, just continue without payment status
        next();
    }
};