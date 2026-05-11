"use strict";
// ============================================
// Fichier : middlewares/auth.middleware.ts
// Description : Middleware JWT (authentification) + RBAC (autorisation par rôle)
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeOwnerOrAdmin = exports.authorize = exports.authenticate = void 0;
const jwt_1 = require("../config/jwt");
const models_1 = require("../models");
const logger_1 = require("../config/logger");
/**
 * Middleware d'authentification : vérifie le Bearer token JWT
 */
const authenticate = async (req, res, next) => {
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
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        // Vérifier que l'utilisateur existe toujours et est actif
        // On cherche d'abord dans Employe, puis dans Stagiaire
        let userExists = false;
        if (decoded.role === 'Stagiaire') {
            const stagiaire = await models_1.Stagiaire.findByPk(decoded.id);
            userExists = !!stagiaire;
            req.user = { ...decoded, isStagiaire: true };
        }
        else {
            const employe = await models_1.Employe.findOne({
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
    }
    catch (error) {
        logger_1.logger.warn(`Tentative d'accès avec token invalide depuis ${req.ip}`);
        res.status(401).json({
            success: false,
            message: 'Token invalide ou expiré. Veuillez vous reconnecter.',
        });
    }
};
exports.authenticate = authenticate;
/**
 * Middleware RBAC : restreint l'accès selon les rôles autorisés
 * Usage : authorize('Direction_RH', 'Manager')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Non authentifié.' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            logger_1.logger.warn(`Accès refusé - Utilisateur ${req.user.email} (rôle: ${req.user.role}) a tenté d'accéder à ${req.path}`);
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
exports.authorize = authorize;
/**
 * Vérifie que l'utilisateur est soit admin (RH/Direction) soit l'utilisateur lui-même
 * Utile pour les endpoints de profil
 */
const authorizeOwnerOrAdmin = (userIdParam = 'id') => {
    return (req, res, next) => {
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
exports.authorizeOwnerOrAdmin = authorizeOwnerOrAdmin;
//# sourceMappingURL=auth.middleware.js.map