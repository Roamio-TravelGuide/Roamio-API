import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined');

interface TokenPayload {
  userId: number;  // Changed to number to match your Prisma User.id (Int)
  role?: UserRole; // Added role for authorization
  email?: string;  // Additional claims if needed
}

export const generateToken = (payload: TokenPayload) => 
  jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

export const verifyToken = (token: string): TokenPayload => 
  jwt.verify(token, JWT_SECRET) as TokenPayload;