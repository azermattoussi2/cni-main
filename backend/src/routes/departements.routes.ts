// routes/departements.routes.ts
import { Router } from 'express';
import { DepartementController } from '../controllers/index';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
router.get('/public', DepartementController.getPublic);
router.get('/', authenticate, DepartementController.getAll);
router.get('/:id', authenticate, DepartementController.getById);
router.post('/', authenticate, authorize('Direction_RH'), DepartementController.create);
router.put('/:id', authenticate, authorize('Direction_RH'), DepartementController.update);
export default router;
