import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ApiResponse } from '../types';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);

    if (errors.isEmpty()) {
      next();
      return;
    }

    const formattedErrors = errors.array().map(error => ({
      field: (error as any).path || 'unknown',
      message: error.msg,
    }));

    res.status(400).json({
      success: false,
      error: 'Errores de validación',
      data: formattedErrors,
    });
  };
};
