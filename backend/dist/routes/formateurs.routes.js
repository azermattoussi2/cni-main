"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/formateurs.routes.ts
const express_1 = require("express");
const index_1 = require("../controllers/index");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticate, index_1.FormateurController.getFormateursInternes);
router.get('/dashboard', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH', 'Manager', 'Employe', 'Formateur_Interne', 'Formateur_Externe'), index_1.FormateurController.getDashboard);
router.get('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH', 'Manager'), (0, validation_middleware_1.validate)(validation_middleware_1.idParamSchema), index_1.FormateurController.getByIdInterne);
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH', 'Manager'), (0, validation_middleware_1.validate)(validation_middleware_1.adminCreateFormateurInterneSchema), index_1.FormateurController.createInterne);
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH', 'Manager'), (0, validation_middleware_1.validate)(validation_middleware_1.adminUpdateFormateurInterneSchema), index_1.FormateurController.updateInterne);
router.post('/inscrire', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH', 'Manager', 'Employe', 'Formateur_Interne'), (0, validation_middleware_1.validate)(validation_middleware_1.inscriptionFormateurSchema), index_1.FormateurController.inscrire);
router.post('/formation/:formationId/notifier', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), index_1.FormateurController.notifierOpportunite);
router.post('/demandes/:demandeId/repondre', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Formateur_Interne'), (0, validation_middleware_1.validate)(validation_middleware_1.reponseOpportuniteSchema), index_1.FormateurController.repondreOpportunite);
router.post('/:id/badges', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), index_1.FormateurController.attribuerBadges);
exports.default = router;
//# sourceMappingURL=formateurs.routes.js.map