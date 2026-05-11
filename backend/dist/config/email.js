"use strict";
// ============================================
// Fichier : config/email.ts
// Description : Configuration Nodemailer pour envoi d'emails
// Compatible variables Laravel-style : MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_ENCRYPTION
// ============================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTemplates = exports.sendEmail = exports.initEmailTransporter = void 0;
exports.deliverEmailNow = deliverEmailNow;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = require("./logger");
const emailQueue_service_1 = require("../services/emailQueue.service");
let transporter;
function smtpFromEnv() {
    const host = process.env.SMTP_HOST || process.env.MAIL_HOST || process.env.EMAIL_HOST;
    const port = parseInt(process.env.SMTP_PORT || process.env.MAIL_PORT || process.env.EMAIL_PORT || '587', 10);
    const user = process.env.SMTP_USER || process.env.MAIL_USERNAME || process.env.EMAIL_USER;
    const rawPass = process.env.SMTP_PASS || process.env.MAIL_PASSWORD || process.env.EMAIL_PASSWORD || '';
    // Gmail App Password souvent copié avec espaces, on normalise.
    const pass = rawPass.replace(/\s+/g, '');
    const enc = (process.env.MAIL_ENCRYPTION || process.env.EMAIL_ENCRYPTION || 'tls').toLowerCase();
    const secure = enc === 'ssl' || port === 465;
    return { host, port, secure, user, pass, tls: enc === 'tls' && !secure };
}
/**
 * Initialise le transporteur email
 * USE_SMTP=true ou production : SMTP réel (Gmail, etc.)
 * Sinon en dev : Ethereal (fake) ou console
 */
const initEmailTransporter = async () => {
    const cfg = smtpFromEnv();
    const canSmtp = !!(cfg.host && cfg.user && cfg.pass);
    const useSmtp = canSmtp &&
        (process.env.NODE_ENV === 'production' ||
            process.env.USE_SMTP === 'true' ||
            process.env.MAIL_MAILER === 'smtp');
    if (useSmtp) {
        transporter = nodemailer_1.default.createTransport({
            host: cfg.host,
            port: cfg.port,
            secure: cfg.secure,
            auth: { user: cfg.user, pass: cfg.pass },
            requireTLS: cfg.tls,
        });
        try {
            await transporter.verify();
            logger_1.logger.info(`📧 SMTP actif et vérifié : ${cfg.host}:${cfg.port} (${cfg.user})`);
        }
        catch (e) {
            logger_1.logger.error(`❌ Échec connexion SMTP (${cfg.host}:${cfg.port})`, e);
            throw e;
        }
        return;
    }
    if (process.env.NODE_ENV === 'production' && !canSmtp) {
        logger_1.logger.warn('⚠️ Production : variables SMTP incomplètes — utilisation du transport de secours.');
    }
    try {
        const testAccount = await nodemailer_1.default.createTestAccount();
        transporter = nodemailer_1.default.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass },
        });
        logger_1.logger.info(`📧 Email de test Ethereal : ${testAccount.user}`);
        logger_1.logger.info(`🔑 Mot de passe Ethereal : ${testAccount.pass}`);
        logger_1.logger.info('📬 Prévisualisation : https://ethereal.email');
    }
    catch {
        logger_1.logger.warn('⚠️ Ethereal indisponible — emails loggés en console');
        transporter = {
            sendMail: async (options) => {
                logger_1.logger.info('📧 EMAIL (console):');
                logger_1.logger.info(`  À: ${options.to} | Sujet: ${options.subject}`);
                return { messageId: `console_${Date.now()}` };
            },
        };
    }
};
exports.initEmailTransporter = initEmailTransporter;
function mailFromHeader() {
    const name = process.env.MAIL_FROM_NAME || process.env.EMAIL_FROM_NAME || 'CNI Stages';
    const addr = process.env.MAIL_FROM_ADDRESS || process.env.EMAIL_FROM || 'noreply@cni.tn';
    return `"${name}" <${addr}>`;
}
/** Livraison SMTP (utilisée par la file d’attente). */
async function deliverEmailNow(options) {
    if (!transporter) {
        await (0, exports.initEmailTransporter)();
    }
    try {
        const info = await transporter.sendMail({
            from: mailFromHeader(),
            to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
            attachments: options.attachments,
        });
        if (process.env.NODE_ENV !== 'production') {
            const previewUrl = nodemailer_1.default.getTestMessageUrl(info);
            if (previewUrl) {
                logger_1.logger.info(`📧 Email envoyé - Prévisualisation : ${previewUrl}`);
            }
        }
        logger_1.logger.info(`✉️ Email envoyé à : ${options.to} | Sujet : ${options.subject}`);
    }
    catch (error) {
        logger_1.logger.error('❌ Erreur envoi email:', error);
        throw error;
    }
}
(0, emailQueue_service_1.registerEmailDeliver)(deliverEmailNow);
/**
 * Envoie un email (file mémoire, Redis si REDIS_URL, ou synchrone si sync / pièces jointes).
 */
const sendEmail = async (options, opts) => {
    await (0, emailQueue_service_1.enqueueEmailDelivery)(options, { sync: opts?.sync });
};
exports.sendEmail = sendEmail;
/**
 * Templates email HTML réutilisables
 */
exports.emailTemplates = {
    // Template de base avec design CNI
    baseTemplate: (title, content, ctaText, ctaUrl) => `
    <!DOCTYPE html>
    <html dir="ltr" lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background:#f4f6fa;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1e40af,#f97316);padding:30px;text-align:center;">
          <div style="display:inline-block;background:white;border-radius:12px;padding:10px 20px;">
            <span style="font-size:24px;font-weight:900;color:#1e40af;">CNI</span>
            <span style="font-size:10px;color:#f97316;display:block;letter-spacing:2px;">STAGES & FORMATIONS</span>
          </div>
        </div>
        <!-- Contenu -->
        <div style="padding:40px 30px;">
          <h1 style="color:#1e293b;font-size:22px;margin-bottom:20px;">${title}</h1>
          <div style="color:#475569;line-height:1.8;font-size:15px;">${content}</div>
          ${ctaText && ctaUrl ? `
            <div style="text-align:center;margin-top:35px;">
              <a href="${ctaUrl}" style="background:linear-gradient(135deg,#1e40af,#3b82f6);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">${ctaText}</a>
            </div>
          ` : ''}
        </div>
        <!-- Footer -->
        <div style="background:#f8fafc;padding:20px 30px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">CNI - Centre National de l'Informatique | Tunis, Tunisie</p>
          <p style="color:#94a3b8;font-size:11px;margin:5px 0 0;">Ce message est automatique, merci de ne pas répondre directement.</p>
        </div>
      </div>
    </body>
    </html>
  `,
    // Confirmation candidature stage
    confirmationCandidature: (nom, prenom, departement) => exports.emailTemplates.baseTemplate(`Confirmation de votre candidature de stage`, `<p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
       <p>Nous avons bien reçu votre candidature pour un stage au département <strong>${departement}</strong>.</p>
       <p>Statut actuel : <strong>En attente d'approbation RH / Manager</strong>.</p>
       <p>Notre équipe RH puis le manager du département examineront votre dossier dans un délai de <strong>5 jours ouvrables</strong>.</p>
       <p>Vous recevrez un e-mail de décision : <strong>acceptée</strong> ou <strong>refusée</strong>.</p>
       <p>Vous pouvez suivre l'évolution de votre candidature via votre espace personnel.</p>
       <p>Merci pour votre intérêt pour CNI !</p>`, 'Suivre ma candidature', `${process.env.FRONTEND_URL}/candidat/suivi`),
    // Notification RH nouvelle candidature
    notificationRH: (nom, prenom, departement, email) => exports.emailTemplates.baseTemplate(`Nouvelle candidature de stage reçue`, `<p>Une nouvelle candidature de stage a été soumise :</p>
       <table style="width:100%;border-collapse:collapse;margin:20px 0;">
         <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;width:40%;"><strong>Candidat</strong></td><td style="padding:8px;border:1px solid #e2e8f0;">${prenom} ${nom}</td></tr>
         <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;"><strong>Email</strong></td><td style="padding:8px;border:1px solid #e2e8f0;">${email}</td></tr>
         <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc;"><strong>Département</strong></td><td style="padding:8px;border:1px solid #e2e8f0;">${departement}</td></tr>
       </table>`, 'Examiner la candidature', `${process.env.FRONTEND_URL}/rh/candidatures`),
    /** Code OTP (vérification e-mail) */
    otpCode: (code, purpose, minutesValid) => exports.emailTemplates.baseTemplate('Code de vérification', `<p>Votre code à usage unique :</p>
       <p style="font-size:32px;font-weight:800;letter-spacing:6px;color:#1e40af;text-align:center;margin:24px 0;">${code}</p>
       <p>Ce code expire dans <strong>${minutesValid} minutes</strong>. Ne le communiquez à personne.</p>
       <p><strong>Objet :</strong> ${purpose === 'candidature' ? 'finaliser votre candidature de stage' : 'finaliser votre inscription'}</p>`),
};
//# sourceMappingURL=email.js.map