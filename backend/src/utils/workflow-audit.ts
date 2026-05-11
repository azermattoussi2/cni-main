// ============================================
// Fichier : utils/workflow-audit.ts
// Description : Traçabilité simple des transitions workflows
// ============================================
import { logger } from '../config/logger';

type AuditEvent = {
  workflow: string;
  entity: string;
  entityId: number;
  action: string;
  actorId?: number;
  metadata?: Record<string, unknown>;
};

export const logWorkflowEvent = (event: AuditEvent) => {
  logger.info(
    `[WORKFLOW] ${event.workflow} | ${event.entity}#${event.entityId} | ${event.action}`,
    {
      actorId: event.actorId,
      metadata: event.metadata || {},
    }
  );
};
