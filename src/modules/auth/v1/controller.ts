import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await new AuthService().login(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}