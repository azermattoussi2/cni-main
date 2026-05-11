"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ============================================
// Fichier : routes/formations.routes.ts
// ============================================
const express_1 = require("express");
const formation_controller_1 = require("../controllers/formation.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const router = (0, express_1.Router)();
// Catalogue public
router.get('/public/catalog', formation_controller_1.FormationController.getPublicCatalog);
router.get('/', auth_middleware_1.authenticate, formation_controller_1.FormationController.getAll);
// Avant /:id pour éviter que « inscriptions » soit pris comme identifiant formation
router.get('/inscriptions/en-attente', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH', 'Manager'), formation_controller_1.FormationController.listInscriptionsEnAttente);
router.get('/:id', auth_middleware_1.authenticate, (0, validation_middleware_1.validate)(validation_middleware_1.idParamSchema), formation_controller_1.FormationController.getById);
// RH/Direction : CRUD formations
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), (0, validation_middleware_1.validate)(validation_middleware_1.creationFormationSchema), formation_controller_1.FormationController.create);
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), (0, validation_middleware_1.validate)(validation_middleware_1.creationFormationSchema), formation_controller_1.FormationController.update);
router.post('/:id/publier', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), (0, validation_middleware_1.validate)(validation_middleware_1.idParamSchema), formation_controller_1.FormationController.publier);
// Employé : s'inscrire à une formation
router.post('/:id/inscription', auth_middleware_1.authenticate, (0, validation_middleware_1.validate)(validation_middleware_1.idParamSchema), formation_controller_1.FormationController.demanderInscription);
// Manager : valider inscription
router.post('/inscriptions/:id/valider-manager', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH', 'Manager'), (0, validation_middleware_1.validate)(validation_middleware_1.validationInscriptionSchema), formation_controller_1.FormationController.validerInscriptionManager);
// RH : validation finale inscription
router.post('/inscriptions/:id/valider-rh', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), (0, validation_middleware_1.validate)(validation_middleware_1.validationInscriptionSchema), formation_controller_1.FormationController.validerInscriptionRH);
// Accept / reject (alias selon le statut courant de l’inscription)
router.post('/inscriptions/:id/accept', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH', 'Manager'), (0, validation_middleware_1.validate)(validation_middleware_1.inscriptionDecisionCommentSchema), formation_controller_1.FormationController.acceptInscription);
router.post('/inscriptions/:id/reject', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH', 'Manager'), (0, validation_middleware_1.validate)(validation_middleware_1.inscriptionDecisionCommentSchema), formation_controller_1.FormationController.rejectInscription);
// Générer certificat
router.post('/inscriptions/:inscriptionId/certificat', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), formation_controller_1.FormationController.genererCertificat);
// Budget
router.post('/budget/verifier', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), formation_controller_1.FormationController.verifierBudgets);
// Rappels
router.post('/rappels', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), formation_controller_1.FormationController.envoyerRappels);
exports.default = router;
//# sourceMappingURL=formations.routes.js.map