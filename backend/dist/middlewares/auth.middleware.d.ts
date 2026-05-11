import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../config/jwt';
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
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware RBAC : restreint l'accès selon les rôles autorisés
 * Usage : authorize('Direction_RH', 'Manager')
 */
export declare const authorize: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Vérifie que l'utilisateur est soit admin (RH/Direction) soit l'utilisateur lui-même
 * Utile pour les endpoints de profil
 */
export declare const authorizeOwnerOrAdmin: (userIdParam?: string) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map