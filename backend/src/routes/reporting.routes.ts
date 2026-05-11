// routes/reporting.routes.ts
import { Router } from 'express';
import { ReportingController } from '../controllers/index';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
router.get('/calendar', authenticate, ReportingController.calendar);
router.get('/rh', authenticate, authorize('Direction_RH'), ReportingController.dashboardRH);
router.get('/manager', authenticate, authorize('Direction_RH', 'Manager'), ReportingController.dashboardManager);
router.get('/employe', authenticate, ReportingController.dashboardEmploye);
router.get('/tuteur', authenticate, ReportingController.dashboardTuteur);
router.get('/rapport-hebdo', authenticate, authorize('Direction_RH'), ReportingController.rapportHebdo);
export default router;
