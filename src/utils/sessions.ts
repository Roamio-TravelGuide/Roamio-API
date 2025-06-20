import { Request } from 'express';
import { verifyToken } from './jwt';

export const getUserIdFromRequest = (req: Request) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('Missing token');
  return verifyToken(token).userId;
};