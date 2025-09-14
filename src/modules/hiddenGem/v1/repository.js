import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class HiddenGemRepository {
    async findByTravelerId(travelerId) {
        try {
            const hiddenPlaces = await prisma.hiddenPlace.findMany({
                where: {
                    traveler_id: parseInt(travelerId),
                },
                include: {
                    traveler: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    profile_picture_url: true,
                                },
                            },
                        },
                    },
                    location: {
                        select: {
                            id: true,
                            latitude: true,
                            longitude: true,
                            address: true,
                            city: true,
                            province: true,
                            district: true,
                            postal_code: true,
                        },
                    },
                    picture: {
                        select: {
                            id: true,
                            url: true,
                            media_type: true,
                            width: true,
                            height: true,
                        },
                    },
                },
                orderBy: {
                    created_at: 'desc',
                },
            });

            return hiddenPlaces;
        } catch (error) {
            console.error('findByTravelerId repository error:', error.message);
            throw error;
        }
    }

    async countByTravelerId(travelerId) {
        try {
            const count = await prisma.hiddenPlace.count({
                where: {
                    traveler_id: parseInt(travelerId),
                },
            });
            return count;
        } catch (error) {
            console.error('countByTravelerId repository error:', error.message);
            throw error;
        }
    }
}

const hiddenGemRepository = new HiddenGemRepository();
export { hiddenGemRepository };