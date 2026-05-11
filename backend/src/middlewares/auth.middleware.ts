// ============================================
// Fichier : middlewares/auth.middleware.ts
// Description : Middleware JWT (authentification) + RBAC (autorisation par rôle)
// ============================================

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../config/jwt';
import { Employe, Stagiaire } from '../models';
import { logger } from '../config/logger';

// Étendre le type Request pour ajouter l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & {
        isStagiaire?: boolean;
      };
    }
  }
}

/**
 * Middleware d'authentification : vérifie le Bearer token JWT
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentification requise. Token manquant.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Vérifier que l'utilisateur existe toujours et est actif
    // On cherche d'abord dans Employe, puis dans Stagiaire
    let userExists = false;

    if (decoded.role === 'Stagiaire') {
      const stagiaire = await Stagiaire.findByPk(decoded.id);
      userExists = !!stagiaire;
      req.user = { ...decoded, isStagiaire: true };
    } else {
      const employe = await Employe.findOne({
        where: { id: decoded.id, isActif: true },
      });
      userExists = !!employe;
      req.user = decoded;
    }

    if (!userExists) {
      res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable ou désactivé.',
      });
      return;
    }

    next();
  } catch (error) {
    logger.warn(`Tentative d'accès avec token invalide depuis ${req.ip}`);
    res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré. Veuillez vous reconnecter.',
    });
  }
};

/**
 * Middleware RBAC : restreint l'accès selon les rôles autorisés
 * Usage : authorize('Direction_RH', 'Manager')
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Non authentifié.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(
        `Accès refusé - Utilisateur ${req.user.email} (rôle: ${req.user.role}) a tenté d'accéder à ${req.path}`
      );
      res.status(403).json({
        success: false,
        message: `Accès refusé. Rôle requis : ${roles.join(' ou ')}.`,
        votreRole: req.user.role,
      });
      return;
    }

    next();
  };
};

/**
 * Vérifie que l'utilisateur est soit admin (RH/Direction) soit l'utilisateur lui-même
 * Utile pour les endpoints de profil
 */
export const authorizeOwnerOrAdmin = (userIdParam = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Non authentifié.' });
      return;
    }

    const targetId = parseInt(req.params[userIdParam]);
    const isAdmin = ['Direction_RH'].includes(req.user.role);
    const isOwner = req.user.id === targetId;

    if (!isAdmin && !isOwner) {
      res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous ne pouvez accéder qu\'à votre propre profil.',
      });
      return;
    }

    next();
  };
};
