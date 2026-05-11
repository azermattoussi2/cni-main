type AuditEvent = {
    workflow: string;
    entity: string;
    entityId: number;
    action: string;
    actorId?: number;
    metadata?: Record<string, unknown>;
};
export declare const logWorkflowEvent: (event: AuditEvent) => void;
export {};
//# sourceMappingURL=workflow-audit.d.ts.map