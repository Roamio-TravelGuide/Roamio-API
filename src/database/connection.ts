import { PrismaClient } from '@prisma/client';
import { dbConfig } from '../config/db.config';

// Initialize Prisma with Neon's connection string
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbConfig.DB_URL, 
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

export const checkDbConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Neon.tech database connected successfully');
  } catch (error) {
    console.error('❌ Neon.tech database connection failed:', error);
    throw error;
  }
};

export default prisma;