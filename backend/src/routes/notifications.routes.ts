// routes/notifications.routes.ts
import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { FormationService } from '../services/formation.service';
import { StagiaireService } from '../services/stagiaire.service';
import { InAppNotificationService } from '../services/inAppNotification.service';

const router = Router();

/** Notifications in-app (agrégation compteurs / actions à faire) */
router.get('/feed', authenticate, async (req, res, next) => {
  try {
    const u = req.user!;
    const data = await InAppNotificationService.list(u.id, u.role);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
});

// Déclencher tous les rappels (stages + formations) - admin seulement
router.post('/rappels/tout', authenticate, authorize('Direction_RH'), async (req, res, next) => {
  try {
    const [stages, formations] = await Promise.all([
      StagiaireService.envoyerRappels(),
      FormationService.envoyerRappels(),
    ]);
    res.json({ success: true, data: { stages, formations } });
  } catch (e) { next(e); }
});

// Vérifier budgets et envoyer alertes
router.post('/budget/alertes', authenticate, authorize('Direction_RH'), async (req, res, next) => {
  try {
    const data = await FormationService.verifierBudgets();
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

export default router;
