"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageController = exports.EmployeController = exports.DepartementController = exports.ReportingController = exports.FormateurController = void 0;
const formateur_service_1 = require("../services/formateur.service");
class FormateurController {
    static async getFormateursInternes(req, res, next) {
        try {
            res.json({
                success: true,
                data: await formateur_service_1.FormateurService.getFormateursInternes(req.query, req.user),
            });
        }
        catch (e) {
            next(e);
        }
    }
    static async getByIdInterne(req, res, next) {
        try {
            const data = await formateur_service_1.FormateurService.getFormateurInterneById(parseInt(req.params.id, 10));
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async createInterne(req, res, next) {
        try {
            const data = await formateur_service_1.FormateurService.createFormateurInterne(req.body);
            res.status(201).json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async updateInterne(req, res, next) {
        try {
            const data = await formateur_service_1.FormateurService.updateFormateurInterne(parseInt(req.params.id, 10), req.body);
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async inscrire(req, res, next) {
        try {
            const data = await formateur_service_1.FormateurService.inscrireCommeFormateur(req.user.id, req.body);
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async getDashboard(req, res, next) {
        try {
            const data = await formateur_service_1.FormateurService.getDashboardFormateur(req.user.id);
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async notifierOpportunite(req, res, next) {
        try {
            const result = await formateur_service_1.FormateurService.notifierOpportunite(parseInt(req.params.formationId));
            res.json({ success: true, ...result });
        }
        catch (e) {
            next(e);
        }
    }
    static async repondreOpportunite(req, res, next) {
        try {
            const result = await formateur_service_1.FormateurService.repondreOpportunite(parseInt(req.params.demandeId), req.user.id, req.body.action, req.body.commentaire);
            res.json({ success: true, ...result });
        }
        catch (e) {
            next(e);
        }
    }
    static async attribuerBadges(req, res, next) {
        try {
            const result = await formateur_service_1.FormateurService.attribuerBadges(parseInt(req.params.id));
            res.json({ success: true, data: result });
        }
        catch (e) {
            next(e);
        }
    }
}
exports.FormateurController = FormateurController;
// ============================================
// Fichier : controllers/reporting.controller.ts
// ============================================
const reporting_service_1 = require("../services/reporting.service");
class ReportingController {
    static async calendar(req, res, next) {
        try {
            const scope = req.query.scope === 'mine' ? 'mine' : 'global';
            res.json({
                success: true,
                data: await reporting_service_1.ReportingService.getCalendarEvents(req.user.id, req.user.role, scope),
            });
        }
        catch (e) {
            next(e);
        }
    }
    static async dashboardRH(req, res, next) {
        try {
            res.json({ success: true, data: await reporting_service_1.ReportingService.getDashboardRH() });
        }
        catch (e) {
            next(e);
        }
    }
    static async dashboardManager(req, res, next) {
        try {
            res.json({ success: true, data: await reporting_service_1.ReportingService.getDashboardManager(req.user.id) });
        }
        catch (e) {
            next(e);
        }
    }
    static async dashboardEmploye(req, res, next) {
        try {
            res.json({ success: true, data: await reporting_service_1.ReportingService.getDashboardEmploye(req.user.id) });
        }
        catch (e) {
            next(e);
        }
    }
    static async dashboardTuteur(req, res, next) {
        try {
            res.json({ success: true, data: await reporting_service_1.ReportingService.getDashboardTuteur(req.user.id) });
        }
        catch (e) {
            next(e);
        }
    }
    static async rapportHebdo(req, res, next) {
        try {
            res.json({ success: true, data: await reporting_service_1.ReportingService.genererRapportHebdomadaire() });
        }
        catch (e) {
            next(e);
        }
    }
}
exports.ReportingController = ReportingController;
// ============================================
// Fichier : controllers/departement.controller.ts
// ============================================
const models_1 = require("../models");
class DepartementController {
    static async getPublic(req, res, next) {
        try {
            const data = await models_1.Departement.findAll({ where: { isActif: true }, order: [['nom', 'ASC']] });
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async getAll(req, res, next) {
        try {
            const data = await models_1.Departement.findAll({ where: { isActif: true }, order: [['nom', 'ASC']] });
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async getById(req, res, next) {
        try {
            const d = await models_1.Departement.findByPk(req.params.id);
            if (!d) {
                res.status(404).json({ success: false, message: 'Introuvable.' });
                return;
            }
            res.json({ success: true, data: d });
        }
        catch (e) {
            next(e);
        }
    }
    static async create(req, res, next) {
        try {
            const d = await models_1.Departement.create(req.body);
            res.status(201).json({ success: true, data: d });
        }
        catch (e) {
            next(e);
        }
    }
    static async update(req, res, next) {
        try {
            const d = await models_1.Departement.findByPk(req.params.id);
            if (!d) {
                res.status(404).json({ success: false, message: 'Introuvable.' });
                return;
            }
            await d.update(req.body);
            res.json({ success: true, data: d });
        }
        catch (e) {
            next(e);
        }
    }
}
exports.DepartementController = DepartementController;
// ============================================
// Fichier : controllers/employe.controller.ts
// ============================================
const models_2 = require("../models");
const sequelize_1 = require("sequelize");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const employeRh_service_1 = require("../services/employeRh.service");
const employeManager_service_1 = require("../services/employeManager.service");
const message_service_1 = require("../services/message.service");
const ioSingleton_1 = require("../socket/ioSingleton");
class EmployeController {
    static async getAll(req, res, next) {
        try {
            const q = req.query;
            const gestion = q.scope === 'gestion';
            const where = {};
            if (!gestion) {
                where.isActif = true;
                where.isArchived = false;
            }
            else {
                if (!req.user || !['Direction_RH', 'Manager'].includes(req.user.role)) {
                    res.status(403).json({ success: false, message: 'Liste étendue réservée à la RH et aux managers.' });
                    return;
                }
                if (q.search?.trim()) {
                    const term = `%${q.search.trim()}%`;
                    where[sequelize_1.Op.or] = [
                        { nom: { [sequelize_1.Op.like]: term } },
                        { prenom: { [sequelize_1.Op.like]: term } },
                        { email: { [sequelize_1.Op.like]: term } },
                    ];
                }
                if (q.isActif === 'true')
                    where.isActif = true;
                else if (q.isActif === 'false')
                    where.isActif = false;
                if (q.isArchived === 'true')
                    where.isArchived = true;
                else if (q.isArchived === 'false')
                    where.isArchived = false;
                else if (q.includeArchived !== '1')
                    where.isArchived = false;
            }
            if (q.role) {
                where.role = q.role;
            }
            else if (req.user?.role === 'Manager') {
                where.role = { [sequelize_1.Op.notIn]: ['Stagiaire', 'Direction_RH'] };
            }
            else {
                where.role = { [sequelize_1.Op.notIn]: ['Stagiaire'] };
            }
            if (req.user?.role === 'Manager') {
                if (!req.user.departementId) {
                    res.json({ success: true, data: [] });
                    return;
                }
                where.departementId = req.user.departementId;
            }
            else if (req.user?.role === 'Direction_RH' && q.departementId) {
                where.departementId = Number(q.departementId);
            }
            const data = await models_2.Employe.findAll({
                where,
                attributes: { exclude: ['motDePasse', 'refreshToken'] },
                include: [{ model: models_2.Departement, as: 'departement', attributes: ['id', 'nom', 'code', 'description'] }],
                order: [['nom', 'ASC']],
            });
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async getById(req, res, next) {
        try {
            const e = await models_2.Employe.findByPk(req.params.id, {
                attributes: { exclude: ['motDePasse', 'refreshToken'] },
                include: [{ model: models_2.Departement, as: 'departement' }],
            });
            if (!e) {
                res.status(404).json({ success: false, message: 'Introuvable.' });
                return;
            }
            res.json({ success: true, data: e });
        }
        catch (e) {
            next(e);
        }
    }
    static async updateProfile(req, res, next) {
        try {
            const emp = await models_2.Employe.findByPk(req.user.id);
            if (!emp) {
                res.status(404).json({ success: false, message: 'Introuvable.' });
                return;
            }
            const { motDePasse, ...rest } = req.body;
            await emp.update(rest);
            if (motDePasse) {
                await emp.update({ motDePasse: await bcryptjs_1.default.hash(motDePasse, 12) });
            }
            res.json({ success: true, data: emp.toSafeObject() });
        }
        catch (e) {
            next(e);
        }
    }
    static async getProfile(req, res, next) {
        try {
            const e = await models_2.Employe.findByPk(req.user.id, {
                attributes: { exclude: ['motDePasse', 'refreshToken'] },
                include: [{ model: models_2.Departement, as: 'departement' }],
            });
            if (!e) {
                res.status(404).json({ success: false, message: 'Introuvable.' });
                return;
            }
            res.json({ success: true, data: e });
        }
        catch (e) {
            next(e);
        }
    }
    static async createRh(req, res, next) {
        try {
            const { password, ...rest } = req.body;
            const data = await employeRh_service_1.EmployeRhService.createEmploye({ ...rest, password });
            res.status(201).json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async updateRh(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const { password, ...rest } = req.body;
            const data = await employeRh_service_1.EmployeRhService.updateEmploye(id, {
                ...rest,
                ...(password ? { motDePasse: password } : {}),
            });
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async setActifRh(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const data = await employeRh_service_1.EmployeRhService.setActif(id, req.body.isActif);
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async setArchivedRh(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const data = await employeRh_service_1.EmployeRhService.setArchived(id, req.body.isArchived);
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async createManager(req, res, next) {
        try {
            const { password, ...rest } = req.body;
            const data = await employeManager_service_1.EmployeManagerService.createEmploye(req.user.id, { ...rest, password });
            res.status(201).json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async updateManager(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const { password, ...rest } = req.body;
            const data = await employeManager_service_1.EmployeManagerService.updateEmploye(req.user.id, id, {
                ...rest,
                ...(password ? { motDePasse: password } : {}),
            });
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async setActifManager(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const data = await employeManager_service_1.EmployeManagerService.setActif(req.user.id, id, req.body.isActif);
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async setArchivedManager(req, res, next) {
        try {
            const id = parseInt(req.params.id, 10);
            const data = await employeManager_service_1.EmployeManagerService.setArchived(req.user.id, id, req.body.isArchived);
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
}
exports.EmployeController = EmployeController;
class MessageController {
    static async contacts(req, res, next) {
        try {
            const data = await message_service_1.MessageService.listContacts(req.user.id, req.user.role);
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async thread(req, res, next) {
        try {
            const otherId = parseInt(req.params.otherId, 10);
            await message_service_1.MessageService.markThreadRead(req.user.id, otherId);
            const data = await message_service_1.MessageService.listThread(req.user.id, otherId);
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async unreadCount(req, res, next) {
        try {
            const count = await message_service_1.MessageService.unreadCount(req.user.id);
            res.json({ success: true, data: { count } });
        }
        catch (e) {
            next(e);
        }
    }
    static async send(req, res, next) {
        try {
            const io = (0, ioSingleton_1.getIo)();
            const data = await message_service_1.MessageService.send(req.user.id, req.body.recipientId, req.body.body, io ?? undefined);
            res.status(201).json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
}
exports.MessageController = MessageController;
//# sourceMappingURL=index.js.map