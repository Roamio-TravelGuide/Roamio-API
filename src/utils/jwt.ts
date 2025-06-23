import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined');

interface TokenPayload {
  userId: number;
  role?: UserRole;
  email?: string;
}

export const generateToken = (payload: TokenPayload) => 
  jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

export const verifyToken = (token: string): TokenPayload => 
  jwt.verify(token, JWT_SECRET) as TokenPayload;