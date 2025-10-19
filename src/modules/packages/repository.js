import { PrismaClient } from '@prisma/client';

export class PackagesRepository {
    constructor() {
        this.prisma = new PrismaClient();
    }

    // Haversine formula for distance calculation (in kilometers)
    _calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    // Get nearby packages by location using Haversine formula
    async findNearbyPackages(latitude, longitude, radiusKm = 50, limit = 4) {
        try {
            // First get all packages with location data
            const allPackages = await this.prisma.tourPackage.findMany({
                where: {
                    status: 'published',
                    tour_stops: {
                        some: {
                            location: {
                                isNot: null
                            }
                        }
                    }
                },
                include: {
                    cover_image: true,
                    tour_stops: {
                        include: {
                            location: true
                        },
                        orderBy: {
                            sequence_no: 'asc'
                        },
                        take: 1 // Get only first stop for location
                    },
                    guide: {
                        include: {
                            user: true
                        }
                    },
                    reviews: true,
                    downloads: true
                }
            });

            // Calculate distances and filter
            const packagesWithDistance = allPackages
                .map(pkg => {
                    const firstStop = pkg.tour_stops[0];
                    if (!firstStop?.location) return null;

                    const distance = this._calculateDistance(
                        latitude,
                        longitude,
                        firstStop.location.latitude,
                        firstStop.location.longitude
                    );

                    return {
                        ...pkg,
                        distance_km: distance
                    };
                })
                .filter(pkg => pkg !== null && pkg.distance_km <= radiusKm)
                .sort((a, b) => a.distance_km - b.distance_km)
                .slice(0, limit);

            return this._formatPackagesResponse(packagesWithDistance);
        } catch (error) {
            console.error('Error in findNearbyPackages:', error);
            throw error;
        }
    }

    // Get recent tours
    async findRecentTours(limit = 3, days = 30) {
        try {
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - days);

            const packages = await this.prisma.tourPackage.findMany({
                where: {
                    status: 'published',
                    created_at: {
                        gte: dateThreshold
                    }
                },
                include: {
                    cover_image: true,
                    tour_stops: {
                        include: {
                            location: true
                        },
                        orderBy: {
                            sequence_no: 'asc'
                        },
                        take: 1
                    },
                    guide: {
                        include: {
                            user: true
                        }
                    },
                    reviews: true,
                    downloads: true
                },
                orderBy: {
                    created_at: 'desc'
                },
                take: limit
            });

            return this._formatPackagesResponse(packages);
        } catch (error) {
            console.error('Error in findRecentTours:', error);
            throw error;
        }
    }

    // Get trending tours
    async findTrendingTours(limit = 4, period = 'week') {
        try {
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - (period === 'month' ? 30 : 7));

            const packages = await this.prisma.tourPackage.findMany({
                where: {
                    status: 'published'
                },
                include: {
                    cover_image: true,
                    tour_stops: {
                        include: {
                            location: true
                        },
                        orderBy: {
                            sequence_no: 'asc'
                        },
                        take: 1
                    },
                    guide: {
                        include: {
                            user: true
                        }
                    },
                    reviews: {
                        where: {
                            date: {
                                gte: dateThreshold
                            }
                        }
                    },
                    downloads: {
                        where: {
                            date: {
                                gte: dateThreshold
                            }
                        }
                    }
                }
            });

            // Calculate trending score
            const packagesWithScore = packages.map(pkg => {
                const downloadCount = pkg.downloads.length;
                const reviewCount = pkg.reviews.length;
                const averageRating = pkg.reviews.length > 0 
                    ? pkg.reviews.reduce((sum, review) => sum + review.rating, 0) / pkg.reviews.length
                    : 0;

                const trendingScore = (downloadCount * 2) + (reviewCount * 1.5) + (averageRating * 10);

                return {
                    ...pkg,
                    trendingScore,
                    downloadCount,
                    reviewCount,
                    averageRating
                };
            });

            const trendingPackages = packagesWithScore
                .sort((a, b) => b.trendingScore - a.trendingScore)
                .slice(0, limit);

            return this._formatPackagesResponse(trendingPackages);
        } catch (error) {
            console.error('Error in findTrendingTours:', error);
            throw error;
        }
    }

    // Get recommended tours
    async findRecommendedTours(limit = 6, userId = null) {
        try {
            const packages = await this.prisma.tourPackage.findMany({
                where: {
                    status: 'published'
                },
                include: {
                    cover_image: true,
                    tour_stops: {
                        include: {
                            location: true
                        },
                        orderBy: {
                            sequence_no: 'asc'
                        },
                        take: 1
                    },
                    guide: {
                        include: {
                            user: true
                        }
                    },
                    reviews: true,
                    downloads: true
                }
            });

            // Calculate recommendation score
            const packagesWithScore = packages.map(pkg => {
                const downloadCount = pkg.downloads.length;
                const reviewCount = pkg.reviews.length;
                const averageRating = pkg.reviews.length > 0 
                    ? pkg.reviews.reduce((sum, review) => sum + review.rating, 0) / pkg.reviews.length
                    : 0;

                const recommendationScore = 
                    (averageRating * 20) + 
                    (downloadCount * 0.5) + 
                    (reviewCount * 0.3);

                return {
                    ...pkg,
                    recommendationScore,
                    downloadCount,
                    reviewCount,
                    averageRating
                };
            });

            const recommendedPackages = packagesWithScore
                .sort((a, b) => b.recommendationScore - a.recommendationScore)
                .slice(0, limit);

            return this._formatPackagesResponse(recommendedPackages);
        } catch (error) {
            console.error('Error in findRecommendedTours:', error);
            throw error;
        }
    }

    // Helper method to format package response
    _formatPackagesResponse(packages) {
        return packages.map(pkg => {
            const firstStop = pkg.tour_stops[0];
            const location = firstStop?.location 
                ? `${firstStop.location.city || ''} ${firstStop.location.district || ''}`.trim()
                : 'Unknown Location';

            const averageRating = pkg.averageRating !== undefined 
                ? pkg.averageRating 
                : (pkg.reviews.length > 0 
                    ? pkg.reviews.reduce((sum, review) => sum + review.rating, 0) / pkg.reviews.length
                    : 0);

            const reviewCount = pkg.reviewCount !== undefined ? pkg.reviewCount : pkg.reviews.length;
            const downloadCount = pkg.downloadCount !== undefined ? pkg.downloadCount : pkg.downloads.length;

            return {
                id: pkg.id,
                title: pkg.title,
                description: pkg.description,
                price: pkg.price,
                duration_minutes: pkg.duration_minutes,
                status: pkg.status,
                created_at: pkg.created_at,
                location: location,
                averageRating: averageRating,
                reviewCount: reviewCount,
                downloadCount: downloadCount,
                cover_image: pkg.cover_image ? {
                    url: pkg.cover_image.url,
                    media_type: pkg.cover_image.media_type
                } : null,
                guide: pkg.guide ? {
                    id: pkg.guide.id,
                    name: pkg.guide.user.name,
                    years_of_experience: pkg.guide.years_of_experience
                } : null,
                tour_stops: pkg.tour_stops.map(stop => ({
                    id: stop.id,
                    stop_name: stop.stop_name,
                    description: stop.description,
                    sequence_no: stop.sequence_no,
                    location: stop.location ? {
                        latitude: stop.location.latitude,
                        longitude: stop.location.longitude,
                        address: stop.location.address,
                        city: stop.location.city,
                        district: stop.location.district
                    } : null
                })),
                // Include distance for nearby packages
                ...(pkg.distance_km !== undefined && { distance_km: pkg.distance_km })
            };
        });
    }

    // Check payment status for a specific package and user
    async checkPaymentStatus(packageId, userId) {
        try {
            console.log(`Checking payment status for package ${packageId} and user ${userId}`);
            
            // Check if there's a completed payment for this package and user
            const payment = await this.prisma.payment.findFirst({
                where: {
                    package_id: packageId,
                    user_id: userId,
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

            const hasPaid = payment !== null;
            
            console.log(`Payment status result: hasPaid=${hasPaid}, payment=${JSON.stringify(payment)}`);

            return {
                packageId: packageId,
                userId: userId,
                hasPaid: hasPaid,
                paymentDetails: payment ? {
                    transactionId: payment.transaction_id,
                    amount: payment.amount,
                    currency: payment.currency,
                    paidAt: payment.paid_at,
                    status: payment.status
                } : null
            };
        } catch (error) {
            console.error('Error in checkPaymentStatus:', error);
            throw error;
        }
    }
}