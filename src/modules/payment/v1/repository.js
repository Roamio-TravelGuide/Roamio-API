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
                            transaction_id : true,
                            amount: true,
                            status: true
                        }
                    },
                    transaction: true
                }
            });
            return payment;
        } catch (error) {
            console.error('Error fetching payment:', error);
            throw new Error('Failed to fetch payment');
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
        const [total, today, monthly,sold_packages] = await Promise.all([
            // Total completed revenue
            this.prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: 'completed' }
            }),
            
            
            // Today's revenue
            this.prisma.payment.aggregate({
                _sum: { amount: true },
                where: { 
                    status: 'completed',
                    paid_at: {
                        gte: todayStart,
                        lte: todayEnd
                    }
                }
            }),
            
            // Monthly breakdown
            this.prisma.$queryRaw`
                SELECT 
                    EXTRACT(MONTH FROM paid_at) as month,
                    SUM(amount)::float as total
                FROM payment
                WHERE status = 'completed'
                AND EXTRACT(YEAR FROM paid_at) = EXTRACT(YEAR FROM NOW())
                GROUP BY month
                ORDER BY month
            `,
            //count of completed packages
            this.prisma.payment.count({
                where:{status:'completed'}
            })
        ]);

        // Format monthly data
        const monthlyFormatted = Array(12).fill(0);
        monthly.forEach(row => {
            monthlyFormatted[row.month - 1] = Number(row.total);
        });

        return {
            sold_packages:sold_packages,
            total_revenue: total._sum.amount || 0,
            today_revenue: today._sum.amount || 0, // Today's revenue
            monthly: monthlyFormatted,
            weekly: Array(4).fill(0),
            yearly: [],
            growth_rate: 0,
            as_of_date: new Date().toISOString() // Timestamp of calculation
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


