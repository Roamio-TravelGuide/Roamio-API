import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined');

const generateToken = (payload) => 
  jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

const verifyToken = (token) => 
  jwt.verify(token, JWT_SECRET);

export { generateToken, verifyToken };