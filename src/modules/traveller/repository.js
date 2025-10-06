import { PrismaClient } from "@prisma/client";

export class TravellerRepository {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async getPackagesForTraveler(travelerId) {
    // Find all completed payments for this traveler, include the related tour package
    const payments = await this.prisma.payment.findMany({
      where: {
        user_id: travelerId,
        status: 'completed',
        package_id: { not: null }
      },
      include: {
        package: true
      },
      orderBy: {
        paid_at: 'asc' // or 'id': 'asc'
      }
    });
    console.log('Raw payments:', payments); // <-- Add this line
    // Extract unique tour packages
    const seen = new Set();
    const uniquePackages = [];
    for (const payment of payments) {
      const pkg = payment.package;
      if (pkg && !seen.has(pkg.id)) {
        uniquePackages.push(pkg);
        seen.add(pkg.id);
      }
    }
    return uniquePackages;
  }
}