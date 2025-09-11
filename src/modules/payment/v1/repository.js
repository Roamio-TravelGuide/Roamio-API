import { PrismaClient } from "@prisma/client";

export class PaymentRepository {
    constructor() {
        this.prisma = new PrismaClient();
    }

    async getPayment(id) {
        try {
            const payment = await this.prisma.payment.findUnique({
                where: { id },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            });
            return payment;
        } catch (error) {
            console.error('Error fetching payment:', error);
            throw new Error('Failed to fetch payment');
        }
    }

    async createPayment(paymentData) {
        try {
            return await this.prisma.payment.create({
                data: paymentData
            });
        } catch (error) {
            console.error('Error creating payment:', error);
            throw new Error('Failed to create payment');
        }
    }

    async updatePaymentStatus(paymentIntentId, status) {
       try {
    return await this.prisma.payment.update({
      where: { transaction_id },
      data: { status }
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw new Error('Failed to update payment status');
  }
    }

    async getTotalRevenue() {
        try {
            // Get current date range for today's revenue
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0); // Start of today
            
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999); // End of today

            // Get all metrics in parallel for better performance
            const [total, today, monthly, sold_packages] = await Promise.all([
                // Total completed revenue
                this.prisma.payment.aggregate({
                    _sum: { amount: true },
                    where: { status: 'succeeded' }
                }),
                
                // Today's revenue
                this.prisma.payment.aggregate({
                    _sum: { amount: true },
                    where: { 
                        status: 'succeeded',
                        createdAt: {
                            gte: todayStart,
                            lte: todayEnd
                        }
                    }
                }),
                
                // Monthly breakdown
                this.prisma.$queryRaw`
                    SELECT 
                        EXTRACT(MONTH FROM "createdAt") as month,
                        SUM(amount) as total
                    FROM "Payment"
                    WHERE status = 'succeeded'
                    AND EXTRACT(YEAR FROM "createdAt") = EXTRACT(YEAR FROM NOW())
                    GROUP BY month
                    ORDER BY month
                `,
                // Count of completed packages
                this.prisma.payment.count({
                    where: { status: 'succeeded' }
                })
            ]);

            // Format monthly data
            const monthlyFormatted = Array(12).fill(0);
            monthly.forEach(row => {
                monthlyFormatted[row.month - 1] = Number(row.total);
            });

            return {
                sold_packages: sold_packages,
                total_revenue: total._sum.amount || 0,
                today_revenue: today._sum.amount || 0,
                monthly: monthlyFormatted,
                weekly: Array(4).fill(0),
                yearly: [],
                growth_rate: 0,
                as_of_date: new Date().toISOString()
            };
            
        } catch (error) {
            console.error("Revenue calculation error:", {
                error: error.message,
                stack: error.stack,
                prismaError: error.code
            });
            throw new Error('Failed to calculate revenue. Please try again later.');
        }
    }
}