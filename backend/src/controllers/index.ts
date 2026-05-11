// ============================================
// Fichier : controllers/formateur.controller.ts
// ============================================
import { Request, Response, NextFunction } from 'express';
import { FormateurService } from '../services/formateur.service';

export class FormateurController {
  static async getFormateursInternes(req: Request, res: Response, next: NextFunction) {
    try {
      res.json({
        success: true,
        data: await FormateurService.getFormateursInternes(req.query, req.user),
      });
    } catch (e) {
      next(e);
    }
  }
  static async getByIdInterne(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await FormateurService.getFormateurInterneById(parseInt(req.params.id, 10));
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }
  static async createInterne(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await FormateurService.createFormateurInterne(req.body);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }
  static async updateInterne(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await FormateurService.updateFormateurInterne(parseInt(req.params.id, 10), req.body);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }
  static async inscrire(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await FormateurService.inscrireCommeFormateur(req.user!.id, req.body);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await FormateurService.getDashboardFormateur(req.user!.id);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }
  static async notifierOpportunite(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await FormateurService.notifierOpportunite(parseInt(req.params.formationId));
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  }
  static async repondreOpportunite(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await FormateurService.repondreOpportunite(
        parseInt(req.params.demandeId),
        req.user!.id,
        req.body.action,
        req.body.commentaire
      );
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  }
  static async attribuerBadges(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await FormateurService.attribuerBadges(parseInt(req.params.id));
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  }
}

// ============================================
// Fichier : controllers/reporting.controller.ts
// ============================================
import { ReportingService } from '../services/reporting.service';

export class ReportingController {
  static async calendar(req: Request, res: Response, next: NextFunction) {
    try {
      const scope = req.query.scope === 'mine' ? 'mine' : 'global';
      res.json({
        success: true,
        data: await ReportingService.getCalendarEvents(req.user!.id, req.user!.role, scope),
      });
    } catch (e) {
      next(e);
    }
  }
  static async dashboardRH(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await ReportingService.getDashboardRH() }); }
    catch (e) { next(e); }
  }
  static async dashboardManager(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await ReportingService.getDashboardManager(req.user!.id) }); }
    catch (e) { next(e); }
  }
  static async dashboardEmploye(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await ReportingService.getDashboardEmploye(req.user!.id) }); }
    catch (e) { next(e); }
  }
  static async dashboardTuteur(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await ReportingService.getDashboardTuteur(req.user!.id) }); }
    catch (e) { next(e); }
  }
  static async rapportHebdo(req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await ReportingService.genererRapportHebdomadaire() }); }
    catch (e) { next(e); }
  }
}

// ============================================
// Fichier : controllers/departement.controller.ts
// ============================================
import { Departement } from '../models';

export class DepartementController {
  static async getPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await Departement.findAll({ where: { isActif: true }, order: [['nom', 'ASC']] });
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await Departement.findAll({ where: { isActif: true }, order: [['nom', 'ASC']] });
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const d = await Departement.findByPk(req.params.id);
      if (!d) { res.status(404).json({ success: false, message: 'Introuvable.' }); return; }
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  }
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const d = await Departement.create(req.body);
      res.status(201).json({ success: true, data: d });
    } catch (e) { next(e); }
  }
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const d = await Departement.findByPk(req.params.id);
      if (!d) { res.status(404).json({ success: false, message: 'Introuvable.' }); return; }
      await d.update(req.body);
      res.json({ success: true, data: d });
    } catch (e) { next(e); }
  }
}

// ============================================
// Fichier : controllers/employe.controller.ts
// ============================================
import { Employe, Departement as Dept } from '../models';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import { EmployeRhService } from '../services/employeRh.service';
import { EmployeManagerService } from '../services/employeManager.service';
import { MessageService } from '../services/message.service';
import { getIo } from '../socket/ioSingleton';

export class EmployeController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const q = req.query as Record<string, string | undefined>;
      const gestion = q.scope === 'gestion';
      const where: any = {};

      if (!gestion) {
        where.isActif = true;
        where.isArchived = false;
      } else {
        if (!req.user || !['Direction_RH', 'Manager'].includes(req.user.role)) {
          res.status(403).json({ success: false, message: 'Liste étendue réservée à la RH et aux managers.' });
          return;
        }
        if (q.search?.trim()) {
          const term = `%${q.search.trim()}%`;
          where[Op.or] = [
            { nom: { [Op.like]: term } },
            { prenom: { [Op.like]: term } },
            { email: { [Op.like]: term } },
          ];
        }
        if (q.isActif === 'true') where.isActif = true;
        else if (q.isActif === 'false') where.isActif = false;
        if (q.isArchived === 'true') where.isArchived = true;
        else if (q.isArchived === 'false') where.isArchived = false;
        else if (q.includeArchived !== '1') where.isArchived = false;
      }

      if (q.role) {
        where.role = q.role;
      } else if (req.user?.role === 'Manager') {
        where.role = { [Op.notIn]: ['Stagiaire', 'Direction_RH'] };
      } else {
        where.role = { [Op.notIn]: ['Stagiaire'] };
      }

      if (req.user?.role === 'Manager') {
        if (!req.user.departementId) {
          res.json({ success: true, data: [] });
          return;
        }
        where.departementId = req.user.departementId;
      } else if (req.user?.role === 'Direction_RH' && q.departementId) {
        where.departementId = Number(q.departementId);
      }

      const data = await Employe.findAll({
        where,
        attributes: { exclude: ['motDePasse', 'refreshToken'] },
        include: [{ model: Dept, as: 'departement', attributes: ['id', 'nom', 'code', 'description'] }],
        order: [['nom', 'ASC']],
      });
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const e = await Employe.findByPk(req.params.id, {
        attributes: { exclude: ['motDePasse', 'refreshToken'] },
        include: [{ model: Dept, as: 'departement' }],
      });
      if (!e) { res.status(404).json({ success: false, message: 'Introuvable.' }); return; }
      res.json({ success: true, data: e });
    } catch (e) { next(e); }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const emp = await Employe.findByPk(req.user!.id);
      if (!emp) { res.status(404).json({ success: false, message: 'Introuvable.' }); return; }
      const { motDePasse, ...rest } = req.body;
      await emp.update(rest);
      if (motDePasse) {
        await emp.update({ motDePasse: await bcrypt.hash(motDePasse, 12) });
      }
      res.json({ success: true, data: emp.toSafeObject() });
    } catch (e) { next(e); }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const e = await Employe.findByPk(req.user!.id, {
        attributes: { exclude: ['motDePasse', 'refreshToken'] },
        include: [{ model: Dept, as: 'departement' }],
      });
      if (!e) { res.status(404).json({ success: false, message: 'Introuvable.' }); return; }
      res.json({ success: true, data: e });
    } catch (e) { next(e); }
  }

  static async createRh(req: Request, res: Response, next: NextFunction) {
    try {
      const { password, ...rest } = req.body;
      const data = await EmployeRhService.createEmploye({ ...rest, password });
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async updateRh(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const { password, ...rest } = req.body;
      const data = await EmployeRhService.updateEmploye(id, {
        ...rest,
        ...(password ? { motDePasse: password } : {}),
      });
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async setActifRh(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await EmployeRhService.setActif(id, req.body.isActif);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async setArchivedRh(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await EmployeRhService.setArchived(id, req.body.isArchived);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async createManager(req: Request, res: Response, next: NextFunction) {
    try {
      const { password, ...rest } = req.body;
      const data = await EmployeManagerService.createEmploye(req.user!.id, { ...rest, password });
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async updateManager(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const { password, ...rest } = req.body;
      const data = await EmployeManagerService.updateEmploye(req.user!.id, id, {
        ...rest,
        ...(password ? { motDePasse: password } : {}),
      });
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async setActifManager(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await EmployeManagerService.setActif(req.user!.id, id, req.body.isActif);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async setArchivedManager(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = await EmployeManagerService.setArchived(req.user!.id, id, req.body.isArchived);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }
}

export class MessageController {
  static async contacts(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await MessageService.listContacts(req.user!.id, req.user!.role);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async thread(req: Request, res: Response, next: NextFunction) {
    try {
      const otherId = parseInt(req.params.otherId, 10);
      await MessageService.markThreadRead(req.user!.id, otherId);
      const data = await MessageService.listThread(req.user!.id, otherId);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  static async unreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await MessageService.unreadCount(req.user!.id);
      res.json({ success: true, data: { count } });
    } catch (e) { next(e); }
  }

  static async send(req: Request, res: Response, next: NextFunction) {
    try {
      const io = getIo();
      const data = await MessageService.send(req.user!.id, req.body.recipientId, req.body.body, io ?? undefined);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  }
}
