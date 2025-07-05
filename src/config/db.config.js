import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_NAME: process.env.DB_NAME || 'your_database_name',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_PORT: process.env.DB_PORT || 5432,

  DB_URL: process.env.DATABASE_URL,

  DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX || '10'),
  DB_POOL_IDLE_TIMEOUT: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
};

export default dbConfig;