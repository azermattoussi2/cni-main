"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StagiaireController = void 0;
const stagiaire_service_1 = require("../services/stagiaire.service");
const stagiaireWorkflow_service_1 = require("../services/stagiaireWorkflow.service");
class StagiaireController {
    // Candidature publique (sans auth)
    static async soumettre(req, res, next) {
        try {
            const files = req.files;
            const stagiaire = await stagiaire_service_1.StagiaireService.soumettreCandidature(req.body, files);
            res.status(201).json({ success: true, message: 'Candidature soumise avec succès.', data: stagiaire });
        }
        catch (e) {
            next(e);
        }
    }
    static async soumettreInterne(req, res, next) {
        try {
            const stagiaire = await stagiaire_service_1.StagiaireService.soumettreCandidature(req.body, undefined, {
                skipOtpVerification: true,
                skipCvRequirement: true,
            });
            res.status(201).json({ success: true, message: 'Candidature interne créée avec succès.', data: stagiaire });
        }
        catch (e) {
            next(e);
        }
    }
    static async getAll(req, res, next) {
        try {
            const data = await stagiaire_service_1.StagiaireService.getAll(req.query, req.user ?? null);
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async getById(req, res, next) {
        try {
            const data = await stagiaire_service_1.StagiaireService.getById(parseInt(req.params.id), req.user ?? null);
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async workflowAccept(req, res, next) {
        try {
            const out = await stagiaireWorkflow_service_1.StagiaireWorkflowService.accept(req.user, parseInt(req.params.id, 10), req.body);
            res.json({ success: true, ...out });
        }
        catch (e) {
            next(e);
        }
    }
    static async workflowAssignProject(req, res, next) {
        try {
            const out = await stagiaireWorkflow_service_1.StagiaireWorkflowService.assignProject(req.user, parseInt(req.params.id, 10), req.body);
            res.json({ success: true, ...out });
        }
        catch (e) {
            next(e);
        }
    }
    static async workflowAssignFormateur(req, res, next) {
        try {
            const out = await stagiaireWorkflow_service_1.StagiaireWorkflowService.assignFormateur(req.user, parseInt(req.params.id, 10), req.body);
            res.json({ success: true, ...out });
        }
        catch (e) {
            next(e);
        }
    }
    static async workflowSendSchedule(req, res, next) {
        try {
            const out = await stagiaireWorkflow_service_1.StagiaireWorkflowService.sendSchedule(req.user, parseInt(req.params.id, 10), req.body || {});
            res.json({ success: true, ...out });
        }
        catch (e) {
            next(e);
        }
    }
    static async workflowCloseStage(req, res, next) {
        try {
            const out = await stagiaireWorkflow_service_1.StagiaireWorkflowService.closeStage(req.user, parseInt(req.params.id, 10), req.body || {});
            res.json({ success: true, ...out });
        }
        catch (e) {
            next(e);
        }
    }
    static async workflowSendAttestation(req, res, next) {
        try {
            const out = await stagiaireWorkflow_service_1.StagiaireWorkflowService.sendAttestation(req.user, parseInt(req.params.id, 10));
            res.json({ success: true, ...out });
        }
        catch (e) {
            next(e);
        }
    }
    static async workflowGenerateAttestation(req, res, next) {
        try {
            const out = await stagiaireWorkflow_service_1.StagiaireWorkflowService.generateAttestation(req.user, parseInt(req.params.id, 10));
            res.json({ success: true, ...out });
        }
        catch (e) {
            next(e);
        }
    }
    static async workflowUploadAttestation(req, res, next) {
        try {
            const out = await stagiaireWorkflow_service_1.StagiaireWorkflowService.uploadAttestation(req.user, parseInt(req.params.id, 10), req.file?.path);
            res.json({ success: true, ...out });
        }
        catch (e) {
            next(e);
        }
    }
    static async workflowReanalyzeCv(req, res, next) {
        try {
            const out = await stagiaireWorkflow_service_1.StagiaireWorkflowService.reanalyzeCv(req.user, parseInt(req.params.id, 10));
            res.json({ success: true, ...out });
        }
        catch (e) {
            next(e);
        }
    }
    static async validerRH(req, res, next) {
        try {
            const { action, commentaire } = req.body;
            const result = await stagiaire_service_1.StagiaireService.validerRH(parseInt(req.params.id), action, commentaire);
            res.json({ success: true, ...result });
        }
        catch (e) {
            next(e);
        }
    }
    static async validerManager(req, res, next) {
        try {
            const result = await stagiaire_service_1.StagiaireService.validerManager(parseInt(req.params.id), req.user.id, req.body.action, req.body);
            res.json({ success: true, ...result });
        }
        catch (e) {
            next(e);
        }
    }
    static async signerConvention(req, res, next) {
        try {
            const result = await stagiaire_service_1.StagiaireService.signerConvention(parseInt(req.params.id), req.user);
            res.json({ success: true, ...result });
        }
        catch (e) {
            next(e);
        }
    }
    static async update(req, res, next) {
        try {
            const data = await stagiaire_service_1.StagiaireService.update(parseInt(req.params.id), req.body);
            res.json({ success: true, data });
        }
        catch (e) {
            next(e);
        }
    }
    static async envoyerRappels(req, res, next) {
        try {
            const result = await stagiaire_service_1.StagiaireService.envoyerRappels();
            res.json({ success: true, ...result });
        }
        catch (e) {
            next(e);
        }
    }
}
exports.StagiaireController = StagiaireController;
//# sourceMappingURL=stagiaire.controller.js.map