// ============================================
// Fichier : middlewares/error.middleware.ts
// Description : Gestion centralisée des erreurs Express
// ============================================

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Erreur opérationnelle connue
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Erreur Sequelize de validation
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    res.status(400).json({
      success: false,
      message: 'Erreur de validation des données',
      errors: (err as any).errors?.map((e: any) => e.message),
    });
    return;
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Token invalide ou expiré.' });
    return;
  }

  // Erreur inconnue - log complet
  logger.error(`Erreur non gérée sur ${req.method} ${req.path}:`, err);

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Erreur serveur interne.'
      : err.message,
  });
};
