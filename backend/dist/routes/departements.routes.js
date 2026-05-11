"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// routes/departements.routes.ts
const express_1 = require("express");
const index_1 = require("../controllers/index");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.get('/public', index_1.DepartementController.getPublic);
router.get('/', auth_middleware_1.authenticate, index_1.DepartementController.getAll);
router.get('/:id', auth_middleware_1.authenticate, index_1.DepartementController.getById);
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), index_1.DepartementController.create);
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('Direction_RH'), index_1.DepartementController.update);
exports.default = router;
//# sourceMappingURL=departements.routes.js.map