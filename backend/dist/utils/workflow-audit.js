"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logWorkflowEvent = void 0;
// ============================================
// Fichier : utils/workflow-audit.ts
// Description : Traçabilité simple des transitions workflows
// ============================================
const logger_1 = require("../config/logger");
const logWorkflowEvent = (event) => {
    logger_1.logger.info(`[WORKFLOW] ${event.workflow} | ${event.entity}#${event.entityId} | ${event.action}`, {
        actorId: event.actorId,
        metadata: event.metadata || {},
    });
};
exports.logWorkflowEvent = logWorkflowEvent;
//# sourceMappingURL=workflow-audit.js.map