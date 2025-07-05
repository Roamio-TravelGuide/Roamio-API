import { AuthService } from './service.js';

class AuthController {
  static async login(req, res, next) {
    try {
      const result = await new AuthService().login(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export { AuthController };