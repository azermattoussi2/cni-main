"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormationController = void 0;
const formation_service_1 = require("../services/formation.service");
const roles_1 = require("../constants/roles");
/** Rôles pouvant avoir monInscription + POST /formations/:id/inscription (même table Employe que les salariés). */
const FORMATION_SELF_ENROLL_ROLES = new Set(roles_1.TEAM_MEMBER_ROLES);
function employeIdForFormationCatalog(req) {
    const u = req.user;
    if (!u?.id || !u.role || !(0, roles_1.isTeamMemberRole)(u.role) || !FORMATION_SELF_ENROLL_ROLES.has(u.role))
        return undefined;
    return u.id;
}
class FormationController {
    static async getPublicCatalog(req, res, next) {
        try {
            const data = await formation_service_1.FormationService.getPublicCatalog();
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    /** GET /formations/inscriptions/en-attente */
    static async listInscriptionsEnAttente(req, res, next) {
        try {
            const u = req.user;
            const data = await formation_service_1.FormationService.listInscriptionsEnAttente(u.id, u.role);
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async getAll(req, res, next) {
        try {
            const employeId = employeIdForFormationCatalog(req);
            const data = await formation_service_1.FormationService.getAll(req.query, employeId ? { employeId } : undefined);
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async getById(req, res, next) {
        try {
            const employeId = employeIdForFormationCatalog(req);
            const data = await formation_service_1.FormationService.getById(parseInt(req.params.id), employeId ? { employeId } : undefined);
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async create(req, res, next) {
        try {
            res.status(201).json({ success: true, data: await formation_service_1.FormationService.create(req.body) });
        }
        catch (e) {
            next(e);
        }
    }
    static async update(req, res, next) {
        try {
            res.json({ success: true, data: await formation_service_1.FormationService.update(parseInt(req.params.id), req.body) });
        }
        catch (e) {
            next(e);
        }
    }
    static async publier(req, res, next) {
        try {
            res.json({ success: true, data: await formation_service_1.FormationService.publier(parseInt(req.params.id)) });
        }
        catch (e) {
            next(e);
        }
    }
    static async demanderInscription(req, res, next) {
        try {
            const result = await formation_service_1.FormationService.demanderInscription(req.user.id, parseInt(req.params.id));
            res.status(201).json({ success: true, ...result });
        }
        catch (e) {
            next(e);
        }
    }
    static async validerInscriptionManager(req, res, next) {
        try {
            const { action, commentaire } = req.body;
            const result = await formation_service_1.FormationService.validerManager(parseInt(req.params.id), req.user.id, action, commentaire);
            res.json({ success: true, ...result });
        }
        catch (e) {
            next(e);
        }
    }
    static async validerInscriptionRH(req, res, next) {
        try {
            const { action, commentaire } = req.body;
            const result = await formation_service_1.FormationService.validerRH(parseInt(req.params.id), action, commentaire);
            res.json({ success: true, ...result });
        }
        catch (e) {
            next(e);
        }
    }
    /** POST …/inscriptions/:id/accept — corps optionnel : { commentaire? } */
    static async acceptInscription(req, res, next) {
        try {
            const commentaire = req.body?.commentaire;
            const u = req.user;
            const result = await formation_service_1.FormationService.decisionInscription(parseInt(req.params.id), u.id, u.role, 'accept', commentaire);
            res.json({ success: true, ...result });
        }
        catch (e) {
            next(e);
        }
    }
    /** POST …/inscriptions/:id/reject */
    static async rejectInscription(req, res, next) {
        try {
            const commentaire = req.body?.commentaire;
            const u = req.user;
            const result = await formation_service_1.FormationService.decisionInscription(parseInt(req.params.id), u.id, u.role, 'reject', commentaire);
            res.json({ success: true, ...result });
        }
        catch (e) {
            next(e);
        }
    }
    static async genererCertificat(req, res, next) {
        try {
            const result = await formation_service_1.FormationService.genererCertificat(parseInt(req.params.inscriptionId));
            res.json({ success: true, ...result });
        }
        catch (e) {
            next(e);
        }
    }
    static async verifierBudgets(req, res, next) {
        try {
            res.json({ success: true, data: await formation_service_1.FormationService.verifierBudgets() });
        }
        catch (e) {
            next(e);
        }
    }
    static async envoyerRappels(req, res, next) {
        try {
            res.json({ success: true, data: await formation_service_1.FormationService.envoyerRappels() });
        }
        catch (e) {
            next(e);
        }
    }
}
exports.FormationController = FormationController;
//# sourceMappingURL=formation.controller.js.map