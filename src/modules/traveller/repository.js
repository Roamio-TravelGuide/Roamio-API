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
        package: {
          include: {
            cover_image: {
              select: {
                url: true,
              },
            },
            guide: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            tour_stops: {
              include: {
                location: true,
                media: {
                  include: {
                    media: {
                      select: {
                        id: true,
                        url: true,
                        media_type: true,
                        duration_seconds: true,
                        file_size: true,
                        format: true,
                        bitrate: true,
                        height: true,
                        width: true,
                        sample_rate: true
                      }
                    }
                  }
                }
              },
              orderBy: {
                sequence_no: 'asc',
              },
            },
          },
        },
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
        // Flatten media for tour_stops
        const transformedPkg = {
          ...pkg,
          tour_stops: pkg.tour_stops.map(stop => ({
            ...stop,
            media: stop.media.map(tsm => tsm.media)
          }))
        };
        uniquePackages.push(transformedPkg);
        seen.add(pkg.id);
      }
    }
    return uniquePackages;
  }
}