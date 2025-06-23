// src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validateRequest = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next(); // Proceed if no errors
    }

    // Handle errors without returning
    res.status(400).json({ errors: errors.array() });
  };
};