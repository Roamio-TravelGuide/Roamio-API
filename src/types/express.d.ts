import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User; // Make it optional if not all routes require auth
    }
  }
}