"use strict";
// ============================================
// Fichier : routes/stagiaires.routes.ts
// Description : Routes Module Stages - workflows 1-4
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stagiaire_controller_1 = require("../controllers/stagiaire.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const router = (0, express_1.Router)();
// --- Routes PUBLIQUES (sans authentification) ---
// POST /api/stagiaires/candidature - Soumettre une candidature (accès public)
router.post('/candidature', upload_middleware_1.uploadMultiple, (0, validation_middleware_1.validate)(validation_middleware_1.candidatureSchema), stagiaire_controller_1.StagiaireController.soumettre);
router.post('/internal', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH', 'Manager'), (0, validation_middleware_1.validate)(validation_middleware_1.candidatureSchema), stagiaire_controller_1.StagiaireController.soumettreInterne);
// --- Routes PROTÉGÉES ---
// GET /api/stagiaires - Liste (RH, manager département, formateur référent = ses dossiers)
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH', 'Manager', 'Formateur_Interne', 'Formateur_Externe'), stagiaire_controller_1.StagiaireController.getAll);
// --- Automatisation workflow (un clic) : placer avant GET :id ---
const WORKFLOW_ROLES = ['Direction_RH', 'Manager', 'Formateur_Interne', 'Formateur_Externe', 'Employe'];
router.post('/:id/workflow/accept', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH', 'Manager'), (0, validation_middleware_1.validate)(validation_middleware_1.stagiaireWorkflowAcceptSchema), stagiaire_controller_1.StagiaireController.workflowAccept);
router.post('/:id/workflow/assign-project', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(...WORKFLOW_ROLES), (0, validation_middleware_1.validate)(validation_middleware_1.stagiaireWorkflowAssignProjectSchema), stagiaire_controller_1.StagiaireController.workflowAssignProject);
router.post('/:id/workflow/assign-formateur', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH', 'Manager'), (0, validation_middleware_1.validate)(validation_middleware_1.stagiaireWorkflowAssignFormateurSchema), stagiaire_controller_1.StagiaireController.workflowAssignFormateur);
router.post('/:id/workflow/send-schedule', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(...WORKFLOW_ROLES), (0, validation_middleware_1.validate)(validation_middleware_1.stagiaireWorkflowSendScheduleSchema), stagiaire_controller_1.StagiaireController.workflowSendSchedule);
router.post('/:id/workflow/close-stage', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(...WORKFLOW_ROLES), (0, validation_middleware_1.validate)(validation_middleware_1.stagiaireWorkflowCloseSchema), stagiaire_controller_1.StagiaireController.workflowCloseStage);
router.post('/:id/workflow/send-attestation', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(...WORKFLOW_ROLES), (0, validation_middleware_1.validate)(validation_middleware_1.stagiaireWorkflowIdOnlySchema), stagiaire_controller_1.StagiaireController.workflowSendAttestation);
router.post('/:id/workflow/generate-attestation', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(...WORKFLOW_ROLES), (0, validation_middleware_1.validate)(validation_middleware_1.stagiaireWorkflowIdOnlySchema), stagiaire_controller_1.StagiaireController.workflowGenerateAttestation);
router.post('/:id/workflow/upload-attestation', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(...WORKFLOW_ROLES), (0, upload_middleware_1.uploadSingle)('attestation'), (0, validation_middleware_1.validate)(validation_middleware_1.idParamSchema), stagiaire_controller_1.StagiaireController.workflowUploadAttestation);
router.post('/:id/workflow/reanalyze-cv', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(...WORKFLOW_ROLES), (0, validation_middleware_1.validate)(validation_middleware_1.stagiaireWorkflowIdOnlySchema), stagiaire_controller_1.StagiaireController.workflowReanalyzeCv);
// GET /api/stagiaires/:id - Détail d'une candidature
router.get('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH', 'Manager', 'Employe', 'Formateur_Interne', 'Formateur_Externe'), stagiaire_controller_1.StagiaireController.getById);
// PUT /api/stagiaires/:id - Modifier les infos d'un stagiaire
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), stagiaire_controller_1.StagiaireController.update);
// POST /api/stagiaires/:id/valider-rh - Validation RH (workflow 2 étape 1)
router.post('/:id/valider-rh', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), (0, validation_middleware_1.validate)(validation_middleware_1.validationStagiaireSchema), stagiaire_controller_1.StagiaireController.validerRH);
// POST /api/stagiaires/:id/valider-manager - Validation Manager (workflow 2 étape 2)
router.post('/:id/valider-manager', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH', 'Manager'), (0, validation_middleware_1.validate)(validation_middleware_1.validationStagiaireSchema), stagiaire_controller_1.StagiaireController.validerManager);
// POST /api/stagiaires/:id/signer-convention - Signature électronique simulée
router.post('/:id/signer-convention', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH', 'Stagiaire'), (0, validation_middleware_1.validate)(validation_middleware_1.signatureConventionSchema), stagiaire_controller_1.StagiaireController.signerConvention);
// POST /api/stagiaires/rappels - Déclencher les rappels automatiques (cron ou manuel)
router.post('/rappels', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), stagiaire_controller_1.StagiaireController.envoyerRappels);
exports.default = router;
//# sourceMappingURL=stagiaires.routes.js.map