import { verifyToken } from './jwt.js';

const getUserIdFromRequest = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('Missing token');
  return verifyToken(token).userId;
};

export { getUserIdFromRequest };