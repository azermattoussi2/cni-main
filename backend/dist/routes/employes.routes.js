"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/employes.routes.ts
const express_1 = require("express");
const index_1 = require("../controllers/index");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH', 'Manager'), index_1.EmployeController.getAll);
router.get('/profile', auth_middleware_1.authenticate, index_1.EmployeController.getProfile);
router.put('/profile', auth_middleware_1.authenticate, index_1.EmployeController.updateProfile);
router.post('/rh', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), (0, validation_middleware_1.validate)(validation_middleware_1.createEmployeRhSchema), index_1.EmployeController.createRh);
router.put('/rh/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), (0, validation_middleware_1.validate)(validation_middleware_1.updateEmployeRhSchema), index_1.EmployeController.updateRh);
router.patch('/rh/:id/actif', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), (0, validation_middleware_1.validate)(validation_middleware_1.employeRhActifSchema), index_1.EmployeController.setActifRh);
router.patch('/rh/:id/archive', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), (0, validation_middleware_1.validate)(validation_middleware_1.employeArchiveSchema), index_1.EmployeController.setArchivedRh);
router.post('/manager', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Manager'), (0, validation_middleware_1.validate)(validation_middleware_1.createEmployeManagerSchema), index_1.EmployeController.createManager);
router.put('/manager/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Manager'), (0, validation_middleware_1.validate)(validation_middleware_1.updateEmployeRhSchema), index_1.EmployeController.updateManager);
router.patch('/manager/:id/actif', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Manager'), (0, validation_middleware_1.validate)(validation_middleware_1.employeRhActifSchema), index_1.EmployeController.setActifManager);
router.patch('/manager/:id/archive', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Manager'), (0, validation_middleware_1.validate)(validation_middleware_1.employeArchiveSchema), index_1.EmployeController.setArchivedManager);
router.get('/:id', auth_middleware_1.authenticate, index_1.EmployeController.getById);
exports.default = router;
//# sourceMappingURL=employes.routes.js.map