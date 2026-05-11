"use strict";
// ============================================
// OTP par e-mail (candidature stage, inscription)
// ============================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
exports.verifyOtpProofToken = verifyOtpProofToken;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const email_1 = require("../config/email");
const error_middleware_1 = require("../middlewares/error.middleware");
const logger_1 = require("../config/logger");
const OTP_TTL_MIN = parseInt(process.env.OTP_EXPIRES_MINUTES || '15', 10);
const MAX_ATTEMPTS = 5;
const OTP_JWT_ISS = 'cni-otp';
function signProof(email, purpose) {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new error_middleware_1.AppError(500, 'JWT_SECRET manquant.');
    return jsonwebtoken_1.default.sign({ sub: 'otp-proof', email: email.toLowerCase().trim(), purpose, iss: OTP_JWT_ISS }, secret, { expiresIn: `${parseInt(process.env.OTP_PROOF_TTL_MINUTES || '60', 10)}m` });
}
function verifyOtpProofToken(token, expectedEmail, expectedPurpose) {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new error_middleware_1.AppError(500, 'JWT_SECRET manquant.');
    try {
        const p = jsonwebtoken_1.default.verify(token, secret);
        if (p.sub !== 'otp-proof' || p.iss !== OTP_JWT_ISS) {
            throw new error_middleware_1.AppError(400, 'Jeton de vérification invalide.');
        }
        if (p.purpose !== expectedPurpose) {
            throw new error_middleware_1.AppError(400, 'Jeton OTP : usage incorrect.');
        }
        if (p.email !== expectedEmail.toLowerCase().trim()) {
            throw new error_middleware_1.AppError(400, 'L’e-mail ne correspond pas au code validé.');
        }
    }
    catch (e) {
        if (e instanceof error_middleware_1.AppError)
            throw e;
        throw new error_middleware_1.AppError(400, 'Jeton de vérification invalide ou expiré. Redemandez un code OTP.');
    }
}
class OtpService {
    static async requestCode(email, purpose) {
        const normalized = email.toLowerCase().trim();
        const code = String(crypto_1.default.randomInt(100000, 1000000));
        const codeHash = await bcryptjs_1.default.hash(code, 10);
        const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);
        await models_1.OtpVerification.destroy({
            where: { email: normalized, purpose, consumedAt: { [sequelize_1.Op.is]: null } },
        });
        await models_1.OtpVerification.create({
            email: normalized,
            purpose,
            codeHash,
            expiresAt,
            attempts: 0,
        });
        try {
            await (0, email_1.sendEmail)({
                to: normalized,
                subject: `Code de vérification ${OTP_TTL_MIN} min — CNI Stages`,
                html: email_1.emailTemplates.otpCode(code, purpose, OTP_TTL_MIN),
                text: `Your OTP code is: ${code}`,
            }, { sync: true });
        }
        catch (e) {
            logger_1.logger.error(`❌ Envoi OTP impossible vers ${normalized} (${purpose})`, e);
            throw new error_middleware_1.AppError(502, 'Échec envoi OTP par e-mail. Vérifiez la configuration SMTP.');
        }
        logger_1.logger.info(`OTP envoyé à ${normalized} (${purpose})`);
        return { sent: true };
    }
    /** Endpoint/script de test manuel SMTP/OTP (sans persistance en base). */
    static async sendTestOtpEmail(email) {
        const normalized = email.toLowerCase().trim();
        const code = String(crypto_1.default.randomInt(100000, 1000000));
        try {
            await (0, email_1.sendEmail)({
                to: normalized,
                subject: 'Verification Code',
                html: `<p>Your OTP code is: <strong>${code}</strong></p>`,
                text: `Your OTP code is: ${code}`,
            }, { sync: true });
            logger_1.logger.info(`✅ Test OTP envoyé à ${normalized}`);
            return { sent: true };
        }
        catch (e) {
            logger_1.logger.error(`❌ Test OTP échoué pour ${normalized}`, e);
            throw new error_middleware_1.AppError(502, 'Test OTP e-mail échoué. Vérifiez SMTP et credentials.');
        }
    }
    static async verifyCode(email, purpose, code) {
        const normalized = email.toLowerCase().trim();
        const row = await models_1.OtpVerification.findOne({
            where: {
                email: normalized,
                purpose,
                consumedAt: { [sequelize_1.Op.is]: null },
                expiresAt: { [sequelize_1.Op.gt]: new Date() },
            },
            order: [['createdAt', 'DESC']],
        });
        if (!row) {
            throw new error_middleware_1.AppError(400, 'Aucun code actif. Demandez un nouveau code.');
        }
        if (row.attempts >= MAX_ATTEMPTS) {
            throw new error_middleware_1.AppError(429, 'Trop de tentatives. Demandez un nouveau code.');
        }
        const ok = await bcryptjs_1.default.compare(code.trim(), row.codeHash);
        await row.update({ attempts: row.attempts + 1 });
        if (!ok) {
            throw new error_middleware_1.AppError(400, 'Code incorrect.');
        }
        await row.update({ consumedAt: new Date() });
        const otpVerificationToken = signProof(normalized, purpose);
        return { otpVerificationToken };
    }
}
exports.OtpService = OtpService;
//# sourceMappingURL=otp.service.js.map