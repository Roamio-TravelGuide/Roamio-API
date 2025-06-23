// src/middleware/error.ts
import { ErrorRequestHandler } from 'express';

interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

export const errorHandler: ErrorRequestHandler = (
  err: AppError,
  req,
  res,
  next
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  console.error('ERROR:', err.stack);

  if (err.name === 'ValidationError') {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
    return; // Add return statement
  }

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message || 'Something went wrong'
  });
};