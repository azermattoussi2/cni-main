// ============================================
// Fichier : controllers/formation.controller.ts
// ============================================
import { Request, Response, NextFunction } from 'express';
import { FormationService } from '../services/formation.service';
import { TEAM_MEMBER_ROLES, isTeamMemberRole } from '../constants/roles';

/** Rôles pouvant avoir monInscription + POST /formations/:id/inscription (même table Employe que les salariés). */
const FORMATION_SELF_ENROLL_ROLES = new Set(TEAM_MEMBER_ROLES);

function employeIdForFormationCatalog(req: Request): number | undefined {
  const u = req.user as { id?: number; role?: string } | undefined;
  if (!u?.id || !u.role || !isTeamMemberRole(u.role) || !FORMATION_SELF_ENROLL_ROLES.has(u.role)) return undefined;
  return u.id;
}

export class FormationController {
  static async getPublicCatalog(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await FormationService.getPublicCatalog();
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  /** GET /formations/inscriptions/en-attente */
  static async listInscriptionsEnAttente(req: Request, res: Response, next: NextFunction) {
    try {
      const u = req.user as { id: number; role: string };
      const data = await FormationService.listInscriptionsEnAttente(u.id, u.role);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const employeId = employeIdForFormationCatalog(req);
      const data = await FormationService.getAll(req.query, employeId ? { employeId } : undefined);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const employeId = employeIdForFormationCatalog(req);
      const data = await FormationService.getById(parseInt(req.params.id), employeId ? { employeId } : undefined);
      res.json({ success: true, data });
    } catch (e) {
      next(e);
    }
  }
  static async create(req: Request, res: Response, next: NextFunction) {
    try { res.status(201).json({ success: true, data: await FormationService.create(req.body) }); }
    catch (e) { next(e); }
  }
  static async update(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await FormationService.update(parseInt(req.params.id), req.body) }); }
    catch (e) { next(e); }
  }
  static async publier(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await FormationService.publier(parseInt(req.params.id)) }); }
    catch (e) { next(e); }
  }
  static async demanderInscription(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await FormationService.demanderInscription(req.user!.id, parseInt(req.params.id));
      res.status(201).json({ success: true, ...result });
    } catch (e) { next(e); }
  }
  static async validerInscriptionManager(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, commentaire } = req.body;
      const result = await FormationService.validerManager(parseInt(req.params.id), req.user!.id, action, commentaire);
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  }
  static async validerInscriptionRH(req: Request, res: Response, next: NextFunction) {
    try {
      const { action, commentaire } = req.body;
      const result = await FormationService.validerRH(parseInt(req.params.id), action, commentaire);
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  }

  /** POST …/inscriptions/:id/accept — corps optionnel : { commentaire? } */
  static async acceptInscription(req: Request, res: Response, next: NextFunction) {
    try {
      const commentaire = req.body?.commentaire as string | undefined;
      const u = req.user as { id: number; role: string };
      const result = await FormationService.decisionInscription(
        parseInt(req.params.id),
        u.id,
        u.role,
        'accept',
        commentaire
      );
      res.json({ success: true, ...result });
    } catch (e) {
      next(e);
    }
  }

  /** POST …/inscriptions/:id/reject */
  static async rejectInscription(req: Request, res: Response, next: NextFunction) {
    try {
      const commentaire = req.body?.commentaire as string | undefined;
      const u = req.user as { id: number; role: string };
      const result = await FormationService.decisionInscription(
        parseInt(req.params.id),
        u.id,
        u.role,
        'reject',
        commentaire
      );
      res.json({ success: true, ...result });
    } catch (e) {
      next(e);
    }
  }
  static async genererCertificat(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await FormationService.genererCertificat(parseInt(req.params.inscriptionId));
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  }
  static async verifierBudgets(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await FormationService.verifierBudgets() }); }
    catch (e) { next(e); }
  }
  static async envoyerRappels(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await FormationService.envoyerRappels() }); }
    catch (e) { next(e); }
  }
}
