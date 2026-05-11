"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../controllers/index");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const roles_1 = require("../constants/roles");
const router = (0, express_1.Router)();
const rolesMessagerie = [...roles_1.INTERNAL_STAFF_ROLES];
router.use(auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(...rolesMessagerie));
router.get('/contacts', index_1.MessageController.contacts);
router.get('/unread-count', index_1.MessageController.unreadCount);
router.get('/thread/:otherId', (0, validation_middleware_1.validate)(validation_middleware_1.messageThreadParamsSchema), index_1.MessageController.thread);
router.post('/', (0, validation_middleware_1.validate)(validation_middleware_1.sendMessageSchema), index_1.MessageController.send);
exports.default = router;
//# sourceMappingURL=messages.routes.js.map