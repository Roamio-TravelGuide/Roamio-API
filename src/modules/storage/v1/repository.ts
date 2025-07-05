// // src/modules/storage/v1/repository.ts
// import { PrismaClient } from '@prisma/client';
// import { IMedia } from './interface';

// const prisma = new PrismaClient();

// export class MediaRepository {
//   static async create(data: Omit<IMedia, 'id' | 'created_at'>): Promise<IMedia> {
//     return prisma.media.create({
//       data: {
//         ...data,
//         created_at: new Date() // Explicitly set creation date
//       }
//     });
//   }

//   static async findByUser(userId: number): Promise<IMedia[]> {
//     return prisma.media.findMany({
//       where: { uploaded_by_id: userId }
//     });
//   }

//   static async delete(id: number): Promise<void> {
//     await prisma.media.delete({
//       where: { id }
//     });
//   }
// }