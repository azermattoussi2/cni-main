// ============================================
// Fichier : config/jwt.ts
// Description : Configuration JWT + Refresh Token
// ============================================

import jwt from 'jsonwebtoken';
import { logger } from './logger';

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
  departementId?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Génère une paire de tokens (access + refresh)
 */
export const generateTokens = (payload: JwtPayload): TokenPair => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(
    { id: payload.id },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
};

/**
 * Vérifie et décode un access token
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
  } catch (error) {
    logger.warn('Token JWT invalide ou expiré');
    throw new Error('Token invalide');
  }
};

/**
 * Vérifie et décode un refresh token
 */
export const verifyRefreshToken = (token: string): { id: number } => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as { id: number };
  } catch (error) {
    throw new Error('Refresh token invalide');
  }
};
