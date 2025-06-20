import dotenv from 'dotenv';
dotenv.config();

export const dbConfig = {
  // Neon.tech PostgreSQL Configuration
  DB_HOST: process.env.PGHOST || 'ep-curly-snowflake-a8est2xo-pooler.eastus2.azure.neon.tech',
  DB_NAME: process.env.PGDATABASE || 'neondb',
  DB_USER: process.env.PGUSER || 'neondb_owner',
  DB_PASSWORD: process.env.PGPASSWORD || 'npg_3IqNbU2WKHAf',
  DB_PORT: 5432, // Default PostgreSQL port

  // Construct DATABASE_URL if not provided (Neon requires SSL)
  DB_URL: 
    process.env.DATABASE_URL || 
    `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}/${process.env.PGDATABASE}?sslmode=require`,

  // Connection Pool Settings (adjust for Neon's connection pooling)
  DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX || '10'),
  DB_POOL_IDLE_TIMEOUT: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
};