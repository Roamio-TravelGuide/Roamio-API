import { PrismaClient } from '@prisma/client';

// Initialize Prisma with standard PostgreSQL connection
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'] // Optional logging
});

const checkDbConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

checkDbConnection().catch(e => {
  console.error('Failed to establish database connection:', e);
  process.exit(1);
});


export default prisma;