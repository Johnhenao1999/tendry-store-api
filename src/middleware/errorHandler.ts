import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import config from '../config';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Ruta no encontrada: ${req.originalUrl}`, 404);
  next(error);
};

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Error interno del servidor';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    statusCode = 400;
    const field = Object.keys((err as any).keyValue)[0];
    message = `El ${field} ya existe. Por favor usa otro valor.`;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'ID inválido';
  }

  // Log error in development
  if (config.nodeEnv === 'development') {
    console.error('Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};
