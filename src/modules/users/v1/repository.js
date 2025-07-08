import  { PrismaClient } from '@prisma/client';

class UserRepository {
    constructor() {
        this.prisma = new PrismaClient();
    }

    async getAllUsers(filterOptions) {
        try {
            const whereClause = {};
            
            if (filterOptions?.role) {
                whereClause.role = filterOptions.role;
            }
            
            if (filterOptions?.status) {
                whereClause.status = filterOptions.status;
            }
            
            if (filterOptions?.search) {
                whereClause.OR = [
                    { name: { contains: filterOptions.search, mode: 'insensitive' } },
                    { email: { contains: filterOptions.search, mode: 'insensitive' } }
                ];
            }

            const users = await this.prisma.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    role: true,
                    status: true,
                    email: true,
                    phone_no: true,
                    name: true,
                    registered_date: true,
                    profile_picture_url: true,
                    bio: true,
                    last_login: true
                },
                orderBy: {
                    [filterOptions?.sortBy || 'registered_date']: filterOptions?.sortOrder || 'desc'
                },
                skip: filterOptions?.page && filterOptions?.limit ? 
                    (filterOptions.page - 1) * filterOptions.limit : undefined,
                take: filterOptions?.limit
            });

            return users;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw new Error('Failed to fetch users');
        }
    }

    async updateUserStatus(userId, status) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { status }
            });
        } catch (error) {
            console.error('Error updating user status:', error);
            throw new Error('Failed to update user status');
        }
    }
}

module.exports = { UserRepository };