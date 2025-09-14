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
        WITH PackageSales AS (
          SELECT
            p.package_id,
            COUNT(p.package_id) as sales_count
          FROM "payment" p
          WHERE p.status = 'completed' AND p.package_id IS NOT NULL
          GROUP BY p.package_id
        ),
        RankedSales AS (
          SELECT
            ps.package_id,
            ps.sales_count,
            RANK() OVER (ORDER BY ps.sales_count DESC) as sales_rank
          FROM PackageSales ps
        )
        SELECT
          tp.id,
          tp.title,
          rs.sales_count::int,
          (SELECT SUM(p.amount) FROM "payment" p WHERE p.package_id = tp.id AND p.status = 'completed')::float as total_revenue
        FROM RankedSales rs
        JOIN "tour_package" tp ON rs.package_id = tp.id
        WHERE rs.sales_rank = 1
      `;

      if (result.length === 0) {
        return []; // No packages sold
      }

      console.log("Top Selling Package(s):", result);
      return result;
    } catch (error) {
      console.error("Error fetching top selling package:", error);
      throw new Error("Failed to fetch top selling package");
    }
  }
}
