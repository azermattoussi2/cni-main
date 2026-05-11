"use strict";
// ============================================
// Fichier : controllers/auth.controller.ts
// Description : Contrôleur authentification
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
class AuthController {
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await auth_service_1.AuthService.loginEmploye(email, password);
            res.json({ success: true, data: result });
        }
        catch (e) {
            next(e);
        }
    }
    static async register(req, res, next) {
        try {
            const result = await auth_service_1.AuthService.register(req.body);
            res.status(201).json({ success: true, data: result });
        }
        catch (e) {
            next(e);
        }
    }
    static async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({ success: false, message: 'Refresh token requis.' });
                return;
            }
            const tokens = await auth_service_1.AuthService.refreshToken(refreshToken);
            res.json({ success: true, data: tokens });
        }
        catch (e) {
            next(e);
        }
    }
    static async logout(req, res, next) {
        try {
            await auth_service_1.AuthService.logout(req.user.id, req.user.role);
            res.json({ success: true, message: 'Déconnexion réussie.' });
        }
        catch (e) {
            next(e);
        }
    }
    static async me(req, res, next) {
        try {
            const u = req.user;
            const data = await auth_service_1.AuthService.getMeFull(u.id, u.role);
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map