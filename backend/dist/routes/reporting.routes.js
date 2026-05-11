"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/reporting.routes.ts
const express_1 = require("express");
const index_1 = require("../controllers/index");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/calendar', auth_middleware_1.authenticate, index_1.ReportingController.calendar);
router.get('/rh', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), index_1.ReportingController.dashboardRH);
router.get('/manager', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH', 'Manager'), index_1.ReportingController.dashboardManager);
router.get('/employe', auth_middleware_1.authenticate, index_1.ReportingController.dashboardEmploye);
router.get('/tuteur', auth_middleware_1.authenticate, index_1.ReportingController.dashboardTuteur);
router.get('/rapport-hebdo', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), index_1.ReportingController.rapportHebdo);
exports.default = router;
//# sourceMappingURL=reporting.routes.js.map