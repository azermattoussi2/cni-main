// ============================================
// Fichier : controllers/auth.controller.ts
// Description : Contrôleur authentification
// ============================================

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.loginEmploye(email, password);
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (e) { next(e); }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(400).json({ success: false, message: 'Refresh token requis.' });
        return;
      }
      const tokens = await AuthService.refreshToken(refreshToken);
      res.json({ success: true, data: tokens });
    } catch (e) { next(e); }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await AuthService.logout(req.user!.id, req.user!.role);
      res.json({ success: true, message: 'Déconnexion réussie.' });
    } catch (e) { next(e); }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const u = req.user!;
      const data = await AuthService.getMeFull(u.id, u.role);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }
}
