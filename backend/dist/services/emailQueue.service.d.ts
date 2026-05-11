import type { SendMailOptions } from 'nodemailer';
/** Même forme que SendEmailOptions dans config/email.ts (évite import circulaire). */
export type MailPayload = {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    attachments?: SendMailOptions['attachments'];
};
type DeliverFn = (o: MailPayload) => Promise<void>;
export declare function registerEmailDeliver(fn: DeliverFn): void;
/**
 * Met en file ou envoie immédiatement.
 */
export declare function enqueueEmailDelivery(options: MailPayload, opts?: {
    sync?: boolean;
}): Promise<void>;
/**
 * Boucle BRPOP (à lancer une fois au démarrage du serveur si REDIS_URL).
 */
export declare function startRedisEmailConsumer(): void;
export {};
//# sourceMappingURL=emailQueue.service.d.ts.map