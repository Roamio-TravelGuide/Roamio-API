// src/modules/web/repositories/authRepository.ts
import { PrismaClient, User } from '@prisma/client';
import { IUser } from './interface';

const prisma = new PrismaClient();

export class AuthRepository {
  async findUserByEmail(email: string): Promise<IUser | null> {
    return prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true,
        phone_no: true,
        name: true,
        role: true,
        status: true,
        registered_date: true,
        password_hash: true,
        last_login: true,
        profile_picture_url: true,
        bio: true
      }
    });
  }

  async createUser(userData: Omit<IUser, 'id'>): Promise<IUser> {
    return prisma.user.create({ 
      data: {
        email: userData.email,
        phone_no: userData.phone_no,
        name: userData.name,
        role: userData.role,
        status: userData.status,
        password_hash: userData.password_hash,
        profile_picture_url: userData.profile_picture_url,
        bio: userData.bio
      },
      select: {
        id: true,
        email: true,
        phone_no: true,
        name: true,
        role: true,
        status: true,
        registered_date: true,
        password_hash: true,
        last_login: true,
        profile_picture_url: true,
        bio: true
      }
    });
  }
}