// routes/formateurs.routes.ts
import { Router } from 'express';
import { FormateurController } from '../controllers/index';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  validate,
  inscriptionFormateurSchema,
  reponseOpportuniteSchema,
  idParamSchema,
  adminCreateFormateurInterneSchema,
  adminUpdateFormateurInterneSchema,
} from '../middlewares/validation.middleware';

const router = Router();

router.get('/', authenticate, FormateurController.getFormateursInternes);
router.get('/dashboard', authenticate, authorize('Direction_RH', 'Manager', 'Employe', 'Formateur_Interne', 'Formateur_Externe'), FormateurController.getDashboard);
router.get(
  '/:id',
  authenticate,
  authorize('Direction_RH', 'Manager'),
  validate(idParamSchema),
  FormateurController.getByIdInterne
);
router.post(
  '/',
  authenticate,
  authorize('Direction_RH', 'Manager'),
  validate(adminCreateFormateurInterneSchema),
  FormateurController.createInterne
);
router.put(
  '/:id',
  authenticate,
  authorize('Direction_RH', 'Manager'),
  validate(adminUpdateFormateurInterneSchema),
  FormateurController.updateInterne
);
router.post('/inscrire', authenticate, authorize('Direction_RH', 'Manager', 'Employe', 'Formateur_Interne'), validate(inscriptionFormateurSchema), FormateurController.inscrire);
router.post('/formation/:formationId/notifier', authenticate, authorize('Direction_RH'), FormateurController.notifierOpportunite);
router.post('/demandes/:demandeId/repondre', authenticate, authorize('Formateur_Interne'), validate(reponseOpportuniteSchema), FormateurController.repondreOpportunite);
router.post('/:id/badges', authenticate, authorize('Direction_RH'), FormateurController.attribuerBadges);

export default router;
