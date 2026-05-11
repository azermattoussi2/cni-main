// ============================================
// OTP par e-mail (candidature stage, inscription)
// ============================================

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { OtpVerification } from '../models';
import { sendEmail, emailTemplates } from '../config/email';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../config/logger';
import type { OtpPurpose } from '../models/OtpVerification';

const OTP_TTL_MIN = parseInt(process.env.OTP_EXPIRES_MINUTES || '15', 10);
const MAX_ATTEMPTS = 5;
const OTP_JWT_ISS = 'cni-otp';

export interface OtpProofPayload {
  sub: 'otp-proof';
  email: string;
  purpose: OtpPurpose;
  iss: string;
}

function signProof(email: string, purpose: OtpPurpose): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError(500, 'JWT_SECRET manquant.');
  return jwt.sign(
    { sub: 'otp-proof', email: email.toLowerCase().trim(), purpose, iss: OTP_JWT_ISS },
    secret,
    { expiresIn: `${parseInt(process.env.OTP_PROOF_TTL_MINUTES || '60', 10)}m` }
  );
}

export function verifyOtpProofToken(token: string, expectedEmail: string, expectedPurpose: OtpPurpose): void {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError(500, 'JWT_SECRET manquant.');
  try {
    const p = jwt.verify(token, secret) as OtpProofPayload & { iss?: string };
    if (p.sub !== 'otp-proof' || p.iss !== OTP_JWT_ISS) {
      throw new AppError(400, 'Jeton de vérification invalide.');
    }
    if (p.purpose !== expectedPurpose) {
      throw new AppError(400, 'Jeton OTP : usage incorrect.');
    }
    if (p.email !== expectedEmail.toLowerCase().trim()) {
      throw new AppError(400, 'L’e-mail ne correspond pas au code validé.');
    }
  } catch (e: unknown) {
    if (e instanceof AppError) throw e;
    throw new AppError(400, 'Jeton de vérification invalide ou expiré. Redemandez un code OTP.');
  }
}

export class OtpService {
  static async requestCode(email: string, purpose: OtpPurpose): Promise<{ sent: boolean }> {
    const normalized = email.toLowerCase().trim();
    const code = String(crypto.randomInt(100000, 1000000));
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);

    await OtpVerification.destroy({
      where: { email: normalized, purpose, consumedAt: { [Op.is]: null } },
    });

    await OtpVerification.create({
      email: normalized,
      purpose,
      codeHash,
      expiresAt,
      attempts: 0,
    });

    try {
      await sendEmail(
        {
          to: normalized,
          subject: `Code de vérification ${OTP_TTL_MIN} min — CNI Stages`,
          html: emailTemplates.otpCode(code, purpose, OTP_TTL_MIN),
          text: `Your OTP code is: ${code}`,
        },
        { sync: true }
      );
    } catch (e) {
      logger.error(`❌ Envoi OTP impossible vers ${normalized} (${purpose})`, e);
      throw new AppError(502, 'Échec envoi OTP par e-mail. Vérifiez la configuration SMTP.');
    }

    logger.info(`OTP envoyé à ${normalized} (${purpose})`);
    return { sent: true };
  }

  /** Endpoint/script de test manuel SMTP/OTP (sans persistance en base). */
  static async sendTestOtpEmail(email: string): Promise<{ sent: boolean }> {
    const normalized = email.toLowerCase().trim();
    const code = String(crypto.randomInt(100000, 1000000));
    try {
      await sendEmail(
        {
          to: normalized,
          subject: 'Verification Code',
          html: `<p>Your OTP code is: <strong>${code}</strong></p>`,
          text: `Your OTP code is: ${code}`,
        },
        { sync: true }
      );
      logger.info(`✅ Test OTP envoyé à ${normalized}`);
      return { sent: true };
    } catch (e) {
      logger.error(`❌ Test OTP échoué pour ${normalized}`, e);
      throw new AppError(502, 'Test OTP e-mail échoué. Vérifiez SMTP et credentials.');
    }
  }

  static async verifyCode(
    email: string,
    purpose: OtpPurpose,
    code: string
  ): Promise<{ otpVerificationToken: string }> {
    const normalized = email.toLowerCase().trim();
    const row = await OtpVerification.findOne({
      where: {
        email: normalized,
        purpose,
        consumedAt: { [Op.is]: null },
        expiresAt: { [Op.gt]: new Date() },
      },
      order: [['createdAt', 'DESC']],
    });

    if (!row) {
      throw new AppError(400, 'Aucun code actif. Demandez un nouveau code.');
    }

    if (row.attempts >= MAX_ATTEMPTS) {
      throw new AppError(429, 'Trop de tentatives. Demandez un nouveau code.');
    }

    const ok = await bcrypt.compare(code.trim(), row.codeHash);
    await row.update({ attempts: row.attempts + 1 });

    if (!ok) {
      throw new AppError(400, 'Code incorrect.');
    }

    await row.update({ consumedAt: new Date() });
    const otpVerificationToken = signProof(normalized, purpose);
    return { otpVerificationToken };
  }
}
