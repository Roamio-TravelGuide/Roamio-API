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
              transaction_id: true,
              amount: true,
              status: true,
            },
          },
          transaction: true,
        },
      });
      return payment;
    } catch (error) {
      console.error("Error fetching payment:", error);
      throw new Error("Failed to fetch payment");
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
          where: { status: "completed" },
        }),

        // Today's revenue
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: "completed",
            paid_at: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
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
          where: { status: "completed" },
        }),
      ]);

      // Format monthly data
      const monthlyFormatted = Array(12).fill(0);
      monthly.forEach((row) => {
        monthlyFormatted[row.month - 1] = Number(row.total);
      });

      return {
        sold_packages: sold_packages,
        total_revenue: total._sum.amount || 0,
        today_revenue: today._sum.amount || 0, // Today's revenue
        monthly: monthlyFormatted,
        weekly: Array(4).fill(0),
        yearly: [],
        growth_rate: 0,
        as_of_date: new Date().toISOString(), // Timestamp of calculation
      };
    } catch (error) {
      console.error("Revenue calculation error:", {
        error: error.message,
        stack: error.stack,
        prismaError: error.code,
      });
      throw new Error("Failed to calculate revenue. Please try again later.");
    }
  }

  async getSoldPackagesCount() {
  try {
    // Get current date
    const now = new Date();

    // Get start of this week (Monday as start of week)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);

    // Get end of this week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Queries in parallel
    const [weekly, monthly, yearly] = await Promise.all([
      // Weekly breakdown (last 7 days)
      this.prisma.$queryRaw`
        SELECT 
          EXTRACT(DOW FROM paid_at) as day, 
          COUNT(*)::int as total
        FROM payment
        WHERE status = 'completed'
          AND paid_at BETWEEN ${weekStart} AND ${weekEnd}
        GROUP BY day
        ORDER BY day
      `,

      // Monthly breakdown (current year)
      this.prisma.$queryRaw`
        SELECT 
          EXTRACT(MONTH FROM paid_at) as month,
          COUNT(*)::int as total
        FROM payment
        WHERE status = 'completed'
          AND EXTRACT(YEAR FROM paid_at) = EXTRACT(YEAR FROM NOW())
        GROUP BY month
        ORDER BY month
      `,

      // Yearly breakdown (all years)
      this.prisma.$queryRaw`
        SELECT 
          EXTRACT(YEAR FROM paid_at) as year,
          COUNT(*)::int as total
        FROM payment
        WHERE status = 'completed'
        GROUP BY year
        ORDER BY year
      `,
    ]);

    // Format weekly (7 days, 0=Sunday → 6=Saturday)
    const weeklyFormatted = Array(7).fill(0);
    weekly.forEach((row) => {
      weeklyFormatted[row.day] = Number(row.total);
    });

    // Format monthly (12 months)
    const monthlyFormatted = Array(12).fill(0);
    monthly.forEach((row) => {
      monthlyFormatted[row.month - 1] = Number(row.total);
    });

    // Format yearly
    const yearlyFormatted = yearly.map((row) => ({
      year: Number(row.year),
      total: Number(row.total),
    }));

    return {
      weekly: weeklyFormatted,
      monthly: monthlyFormatted,
      yearly: yearlyFormatted,
      as_of_date: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Package count calculation error:", {
      error: error.message,
      stack: error.stack,
      prismaError: error.code,
    });
    throw new Error("Failed to calculate package counts. Please try again later.");
  }
}


  async getTopPerformerRevenue() {
    try {
      const result = await this.prisma.$queryRaw`
      SELECT 
        tg.id,
        u.name,
        u.email,
        COALESCE(SUM(p.amount), 0) as total_revenue,
        COUNT(DISTINCT tp.id) as package_count
      FROM "travel_guide" tg
      JOIN "user" u ON tg.user_id = u.id
      LEFT JOIN "tour_package" tp ON tg.id = tp.guide_id
      LEFT JOIN "payment" p ON tp.id = p.package_id
      WHERE p.status = 'completed'
      AND tp.status = 'published'
      GROUP BY tg.id, u.name, u.email
      ORDER BY total_revenue DESC
      LIMIT 1
    `;

      if (result.length === 0) {
        return null; // No performer found
      }

      const topPerformer = {
        id: result[0].id,
        name: result[0].name,
        email: result[0].email,
        totalRevenue: parseFloat(result[0].total_revenue) || 0,
        packageCount: parseInt(result[0].package_count) || 0,
      };

      console.log("Top Performer Revenue:", topPerformer);

      return topPerformer;
    } catch (error) {
      console.error("Error fetching top performer:", error);
      throw new Error("Failed to fetch top performer");
    }
  }
  async getTopSellingPackage() {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT
          tp.id,
          tp.title,
          COUNT(p.package_id)::int as sales_count,
          SUM(p.amount)::float as total_revenue
        FROM "payment" p
        JOIN "tour_package" tp ON p.package_id = tp.id
        WHERE p.status = 'completed' AND p.package_id IS NOT NULL
        GROUP BY tp.id, tp.title
        ORDER BY sales_count DESC
        LIMIT 1
      `;

      if (result.length === 0) {
        return null; // No packages sold
      }

      console.log("Top Selling Package:", result[0]);
      return result[0];
    } catch (error) {
      console.error("Error fetching top selling package:", error);
      throw new Error("Failed to fetch top selling package");
    }
  }

  async createStripPayment(stripPaymentData) {
    try {
      console.log('Repository createStripPayment called with:', stripPaymentData);

      const paymentData = {
        transaction_id: stripPaymentData.transaction_id,
        user_id: stripPaymentData.user_id,
        amount: stripPaymentData.amount,
        status: stripPaymentData.status,
        currency: stripPaymentData.currency,
        paid_at: stripPaymentData.paid_at,
        invoice_number: stripPaymentData.invoice_number,
      };

      // Only add package_id if it's not null
      if (stripPaymentData.package_id !== null && stripPaymentData.package_id !== undefined) {
        paymentData.package_id = stripPaymentData.package_id;
      }

      const payment = await this.prisma.payment.create({
        data: paymentData
      });

      console.log('Payment created successfully in repository:', payment);
      return payment;
    } catch (error) {
      console.error("Error creating strip payment:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        meta: error.meta
      });
      throw new Error(`Failed to create strip payment: ${error.message}`);
    }
  }

}



