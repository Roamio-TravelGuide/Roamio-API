import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await new AuthService().login({ email, password });
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(401).json({ error: error.message });
      } else {
        res.status(401).json({ error: 'An unknown error occurred' });
      }
    }
  }
}