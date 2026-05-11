// ============================================
// Fichier : routes/stagiaires.routes.ts
// Description : Routes Module Stages - workflows 1-4
// ============================================

import { Router } from 'express';
import { StagiaireController } from '../controllers/stagiaire.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { uploadMultiple, uploadSingle } from '../middlewares/upload.middleware';
import {
  validate,
  candidatureSchema,
  validationStagiaireSchema,
  signatureConventionSchema,
  stagiaireWorkflowAcceptSchema,
  stagiaireWorkflowAssignProjectSchema,
  stagiaireWorkflowAssignFormateurSchema,
  stagiaireWorkflowCloseSchema,
  stagiaireWorkflowSendScheduleSchema,
  stagiaireWorkflowIdOnlySchema,
  idParamSchema,
} from '../middlewares/validation.middleware';

const router = Router();

// --- Routes PUBLIQUES (sans authentification) ---
// POST /api/stagiaires/candidature - Soumettre une candidature (accès public)
router.post('/candidature', uploadMultiple, validate(candidatureSchema), StagiaireController.soumettre);
router.post(
  '/internal',
  authenticate,
  authorize('Direction_RH', 'Manager'),
  validate(candidatureSchema),
  StagiaireController.soumettreInterne
);

// --- Routes PROTÉGÉES ---

// GET /api/stagiaires - Liste (RH, manager département, formateur référent = ses dossiers)
router.get('/', authenticate, authorize('Direction_RH', 'Manager', 'Formateur_Interne', 'Formateur_Externe'), StagiaireController.getAll);

// --- Automatisation workflow (un clic) : placer avant GET :id ---
const WORKFLOW_ROLES = ['Direction_RH', 'Manager', 'Formateur_Interne', 'Formateur_Externe', 'Employe'] as const;

router.post(
  '/:id/workflow/accept',
  authenticate,
  authorize('Direction_RH', 'Manager'),
  validate(stagiaireWorkflowAcceptSchema),
  StagiaireController.workflowAccept
);
router.post(
  '/:id/workflow/assign-project',
  authenticate,
  authorize(...WORKFLOW_ROLES),
  validate(stagiaireWorkflowAssignProjectSchema),
  StagiaireController.workflowAssignProject
);
router.post(
  '/:id/workflow/assign-formateur',
  authenticate,
  authorize('Direction_RH', 'Manager'),
  validate(stagiaireWorkflowAssignFormateurSchema),
  StagiaireController.workflowAssignFormateur
);
router.post(
  '/:id/workflow/send-schedule',
  authenticate,
  authorize(...WORKFLOW_ROLES),
  validate(stagiaireWorkflowSendScheduleSchema),
  StagiaireController.workflowSendSchedule
);
router.post(
  '/:id/workflow/close-stage',
  authenticate,
  authorize(...WORKFLOW_ROLES),
  validate(stagiaireWorkflowCloseSchema),
  StagiaireController.workflowCloseStage
);
router.post(
  '/:id/workflow/send-attestation',
  authenticate,
  authorize(...WORKFLOW_ROLES),
  validate(stagiaireWorkflowIdOnlySchema),
  StagiaireController.workflowSendAttestation
);
router.post(
  '/:id/workflow/generate-attestation',
  authenticate,
  authorize(...WORKFLOW_ROLES),
  validate(stagiaireWorkflowIdOnlySchema),
  StagiaireController.workflowGenerateAttestation
);
router.post(
  '/:id/workflow/upload-attestation',
  authenticate,
  authorize(...WORKFLOW_ROLES),
  uploadSingle('attestation'),
  validate(idParamSchema),
  StagiaireController.workflowUploadAttestation
);
router.post(
  '/:id/workflow/reanalyze-cv',
  authenticate,
  authorize(...WORKFLOW_ROLES),
  validate(stagiaireWorkflowIdOnlySchema),
  StagiaireController.workflowReanalyzeCv
);
// GET /api/stagiaires/:id - Détail d'une candidature
router.get('/:id', authenticate, authorize('Direction_RH', 'Manager', 'Employe', 'Formateur_Interne', 'Formateur_Externe'), StagiaireController.getById);

// PUT /api/stagiaires/:id - Modifier les infos d'un stagiaire
router.put('/:id', authenticate, authorize('Direction_RH'), StagiaireController.update);

// POST /api/stagiaires/:id/valider-rh - Validation RH (workflow 2 étape 1)
router.post('/:id/valider-rh', authenticate, authorize('Direction_RH'), validate(validationStagiaireSchema), StagiaireController.validerRH);

// POST /api/stagiaires/:id/valider-manager - Validation Manager (workflow 2 étape 2)
router.post('/:id/valider-manager', authenticate, authorize('Direction_RH', 'Manager'), validate(validationStagiaireSchema), StagiaireController.validerManager);

// POST /api/stagiaires/:id/signer-convention - Signature électronique simulée
router.post('/:id/signer-convention', authenticate, authorize('Direction_RH', 'Stagiaire'), validate(signatureConventionSchema), StagiaireController.signerConvention);

// POST /api/stagiaires/rappels - Déclencher les rappels automatiques (cron ou manuel)
router.post('/rappels', authenticate, authorize('Direction_RH'), StagiaireController.envoyerRappels);

export default router;
