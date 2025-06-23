import dotenv from 'dotenv';
dotenv.config();

export const appConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000'),
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-key',
};