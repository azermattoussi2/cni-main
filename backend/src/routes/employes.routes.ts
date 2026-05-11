// routes/employes.routes.ts
import { Router } from 'express';
import { EmployeController } from '../controllers/index';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import {
  validate,
  createEmployeRhSchema,
  updateEmployeRhSchema,
  employeRhActifSchema,
  createEmployeManagerSchema,
  employeArchiveSchema,
} from '../middlewares/validation.middleware';

const router = Router();

router.get('/', authenticate, authorize('Direction_RH', 'Manager'), EmployeController.getAll);
router.get('/profile', authenticate, EmployeController.getProfile);
router.put('/profile', authenticate, EmployeController.updateProfile);

router.post(
  '/rh',
  authenticate,
  authorize('Direction_RH'),
  validate(createEmployeRhSchema),
  EmployeController.createRh
);
router.put(
  '/rh/:id',
  authenticate,
  authorize('Direction_RH'),
  validate(updateEmployeRhSchema),
  EmployeController.updateRh
);
router.patch(
  '/rh/:id/actif',
  authenticate,
  authorize('Direction_RH'),
  validate(employeRhActifSchema),
  EmployeController.setActifRh
);
router.patch(
  '/rh/:id/archive',
  authenticate,
  authorize('Direction_RH'),
  validate(employeArchiveSchema),
  EmployeController.setArchivedRh
);

router.post(
  '/manager',
  authenticate,
  authorize('Manager'),
  validate(createEmployeManagerSchema),
  EmployeController.createManager
);
router.put(
  '/manager/:id',
  authenticate,
  authorize('Manager'),
  validate(updateEmployeRhSchema),
  EmployeController.updateManager
);
router.patch(
  '/manager/:id/actif',
  authenticate,
  authorize('Manager'),
  validate(employeRhActifSchema),
  EmployeController.setActifManager
);
router.patch(
  '/manager/:id/archive',
  authenticate,
  authorize('Manager'),
  validate(employeArchiveSchema),
  EmployeController.setArchivedManager
);

router.get('/:id', authenticate, EmployeController.getById);

export default router;
