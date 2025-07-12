import { AuthService } from "./service.js";

class AuthController {
  static async login(req, res, next) {
    try {
      const result = await new AuthService().login(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async signup(req, res, next) {
    try {
      const result = await new AuthService().signup(req.body);
      res.status(201).json(result);
    } catch (error) {
      next({ status: 409, message: error.message });
    }
  }
}

export { AuthController };
