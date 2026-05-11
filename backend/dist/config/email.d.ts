import nodemailer from 'nodemailer';
/**
 * Initialise le transporteur email
 * USE_SMTP=true ou production : SMTP réel (Gmail, etc.)
 * Sinon en dev : Ethereal (fake) ou console
 */
export declare const initEmailTransporter: () => Promise<void>;
export type SendEmailOptions = {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    attachments?: nodemailer.SendMailOptions['attachments'];
};
/** Livraison SMTP (utilisée par la file d’attente). */
export declare function deliverEmailNow(options: SendEmailOptions): Promise<void>;
/**
 * Envoie un email (file mémoire, Redis si REDIS_URL, ou synchrone si sync / pièces jointes).
 */
export declare const sendEmail: (options: SendEmailOptions, opts?: {
    sync?: boolean;
}) => Promise<void>;
/**
 * Templates email HTML réutilisables
 */
export declare const emailTemplates: {
    baseTemplate: (title: string, content: string, ctaText?: string, ctaUrl?: string) => string;
    confirmationCandidature: (nom: string, prenom: string, departement: string) => string;
    notificationRH: (nom: string, prenom: string, departement: string, email: string) => string;
    /** Code OTP (vérification e-mail) */
    otpCode: (code: string, purpose: "candidature" | "register", minutesValid: number) => string;
};
//# sourceMappingURL=email.d.ts.map