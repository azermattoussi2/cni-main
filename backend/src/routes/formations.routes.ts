// ============================================
// Fichier : routes/formations.routes.ts
// ============================================
import { Router } from 'express';
import { FormationController } from '../controllers/formation.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  validate,
  creationFormationSchema,
  idParamSchema,
  validationInscriptionSchema,
  inscriptionDecisionCommentSchema,
} from '../middlewares/validation.middleware';

const router = Router();

// Catalogue public
router.get('/public/catalog', FormationController.getPublicCatalog);
router.get('/', authenticate, FormationController.getAll);
// Avant /:id pour éviter que « inscriptions » soit pris comme identifiant formation
router.get(
  '/inscriptions/en-attente',
  authenticate,
  authorize('Direction_RH', 'Manager'),
  FormationController.listInscriptionsEnAttente
);
router.get('/:id', authenticate, validate(idParamSchema), FormationController.getById);

// RH/Direction : CRUD formations
router.post('/', authenticate, authorize('Direction_RH'), validate(creationFormationSchema), FormationController.create);
router.put('/:id', authenticate, authorize('Direction_RH'), validate(creationFormationSchema), FormationController.update);
router.post('/:id/publier', authenticate, authorize('Direction_RH'), validate(idParamSchema), FormationController.publier);

// Employé : s'inscrire à une formation
router.post('/:id/inscription', authenticate, validate(idParamSchema), FormationController.demanderInscription);

// Manager : valider inscription
router.post('/inscriptions/:id/valider-manager', authenticate, authorize('Direction_RH', 'Manager'), validate(validationInscriptionSchema), FormationController.validerInscriptionManager);

// RH : validation finale inscription
router.post('/inscriptions/:id/valider-rh', authenticate, authorize('Direction_RH'), validate(validationInscriptionSchema), FormationController.validerInscriptionRH);

// Accept / reject (alias selon le statut courant de l’inscription)
router.post(
  '/inscriptions/:id/accept',
  authenticate,
  authorize('Direction_RH', 'Manager'),
  validate(inscriptionDecisionCommentSchema),
  FormationController.acceptInscription
);
router.post(
  '/inscriptions/:id/reject',
  authenticate,
  authorize('Direction_RH', 'Manager'),
  validate(inscriptionDecisionCommentSchema),
  FormationController.rejectInscription
);

// Générer certificat
router.post('/inscriptions/:inscriptionId/certificat', authenticate, authorize('Direction_RH'), FormationController.genererCertificat);

// Budget
router.post('/budget/verifier', authenticate, authorize('Direction_RH'), FormationController.verifierBudgets);

// Rappels
router.post('/rappels', authenticate, authorize('Direction_RH'), FormationController.envoyerRappels);

export default router;
