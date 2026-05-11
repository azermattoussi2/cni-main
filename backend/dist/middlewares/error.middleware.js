"use strict";
// ============================================
// Fichier : middlewares/error.middleware.ts
// Description : Gestion centralisée des erreurs Express
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const logger_1 = require("../config/logger");
class AppError extends Error {
    constructor(statusCode, message, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, _next) => {
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
            errors: err.errors?.map((e) => e.message),
        });
        return;
    }
    // Erreur JWT
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        res.status(401).json({ success: false, message: 'Token invalide ou expiré.' });
        return;
    }
    // Erreur inconnue - log complet
    logger_1.logger.error(`Erreur non gérée sur ${req.method} ${req.path}:`, err);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Erreur serveur interne.'
            : err.message,
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.middleware.js.map