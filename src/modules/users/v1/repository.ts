import { PrismaClient } from '@prisma/client';
import { User, UserFilterOptions } from './interface';

export class UserRepository {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    public async getAllUsers(filterOptions?: UserFilterOptions): Promise<Partial<User>[]> {
        try {
            const whereClause: any = {};
            
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

            return users as Partial<User>[];
        } catch (error) {
            console.error('Error fetching users:', error);
            throw new Error('Failed to fetch users');
        }
    }

    public async updateUserStatus(userId: number, status: 'active' | 'blocked'): Promise<void> {
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