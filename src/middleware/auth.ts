import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { AuthRequest, JWTPayload, ApiResponse } from '../types';
import config from '../config';

export const authenticate = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Acceso no autorizado. Token no proporcionado.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no encontrado.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expirado. Por favor inicia sesión nuevamente.',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Token inválido.',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Error de autenticación.',
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response<ApiResponse>, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'No autenticado.',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta acción.',
      });
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch {
    // Token invalid, continue without user
    next();
  }
};
