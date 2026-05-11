"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/notifications.routes.ts
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const formation_service_1 = require("../services/formation.service");
const stagiaire_service_1 = require("../services/stagiaire.service");
const inAppNotification_service_1 = require("../services/inAppNotification.service");
const router = (0, express_1.Router)();
/** Notifications in-app (agrégation compteurs / actions à faire) */
router.get('/feed', auth_middleware_1.authenticate, async (req, res, next) => {
    try {
        const u = req.user;
        const data = await inAppNotification_service_1.InAppNotificationService.list(u.id, u.role);
        res.json({ success: true, data });
    }
    catch (e) {
        next(e);
    }
});
// Déclencher tous les rappels (stages + formations) - admin seulement
router.post('/rappels/tout', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), async (req, res, next) => {
    try {
        const [stages, formations] = await Promise.all([
            stagiaire_service_1.StagiaireService.envoyerRappels(),
            formation_service_1.FormationService.envoyerRappels(),
        ]);
        res.json({ success: true, data: { stages, formations } });
    }
    catch (e) {
        next(e);
    }
});
// Vérifier budgets et envoyer alertes
router.post('/budget/alertes', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), async (req, res, next) => {
    try {
        const data = await formation_service_1.FormationService.verifierBudgets();
        res.json({ success: true, data });
    }
    catch (e) {
        next(e);
    }
});
exports.default = router;
//# sourceMappingURL=notifications.routes.js.map