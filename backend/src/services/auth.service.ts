// ============================================
// Fichier : services/auth.service.ts
// Description : Service d'authentification JWT + RBAC
// Gère login, register, refresh token pour tous les rôles
// ============================================

import { Employe, Stagiaire, Departement } from '../models';
import { generateTokens, verifyRefreshToken } from '../config/jwt';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../config/logger';
import { verifyOtpProofToken } from './otp.service';
import { emailTemplates, sendEmail } from '../config/email';
import { PUBLIC_REGISTER_ROLES } from '../constants/roles';

export class AuthService {
  /**
   * Connexion d'un employé (tous rôles sauf Stagiaire)
   */
  static async loginEmploye(email: string, password: string) {
    const employe = await Employe.findOne({
      where: { email },
      include: [{ model: Departement, as: 'departement', attributes: ['id', 'nom', 'code'] }],
    });

    if (!employe) {
      throw new AppError(401, 'Email ou mot de passe incorrect.');
    }

    if (!employe.isActif) {
      throw new AppError(403, 'Compte créé, en attente de validation RH/Manager.');
    }

    const isValid = await employe.comparePassword(password);
    if (!isValid) {
      logger.warn(`Tentative de connexion échouée pour : ${email}`);
      throw new AppError(401, 'Email ou mot de passe incorrect.');
    }

    const tokens = generateTokens({
      id: employe.id,
      email: employe.email,
      role: employe.role,
      departementId: employe.departementId,
    });

    // Sauvegarder le refresh token
    await employe.update({ refreshToken: tokens.refreshToken });

    logger.info(`✅ Connexion réussie : ${email} (${employe.role})`);

    return {
      user: employe.toSafeObject(),
      ...tokens,
    };
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  static async register(data: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    role?: 'Employe' | 'Formateur_Interne' | 'Formateur_Externe';
    departementId: number;
    telephone?: string;
    poste?: string;
    otpVerificationToken?: string;
  }) {
    const registerOtpRequired = process.env.REGISTER_OTP_REQUIRED !== 'false';
    if (registerOtpRequired) {
      const token = data.otpVerificationToken;
      if (!token) {
        throw new AppError(400, 'Vérification e-mail requise : demandez un code OTP puis validez-le avant de créer le compte.');
      }
      verifyOtpProofToken(token, data.email, 'register');
    }
    delete (data as { otpVerificationToken?: string }).otpVerificationToken;

    // Vérifier si l'email existe déjà
    const exists = await Employe.findOne({ where: { email: data.email } });
    if (exists) {
      throw new AppError(409, 'Un compte avec cet email existe déjà.');
    }

    const role = data.role || 'Employe';
    if (!PUBLIC_REGISTER_ROLES.includes(role)) {
      throw new AppError(400, 'Rôle non autorisé via cette inscription publique.');
    }

    const dept = await Departement.findByPk(data.departementId);
    if (!dept) {
      throw new AppError(404, 'Département introuvable.');
    }

    const employe = await Employe.create({
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      motDePasse: data.password,
      role,
      departementId: data.departementId,
      telephone: data.telephone,
      poste: data.poste,
      isActif: false,
    });

    await sendEmail({
      to: employe.email,
      subject: '✅ Demande de compte reçue — en attente de validation',
      html: emailTemplates.baseTemplate(
        'Demande enregistrée',
        `<p>Bonjour <strong>${employe.prenom} ${employe.nom}</strong>,</p>
         <p>Votre demande de compte a bien été reçue.</p>
         <p>Statut: <strong>en attente de validation</strong> par la RH ou le manager du département <strong>${dept.nom}</strong>.</p>
         <p>Vous recevrez un e-mail après acceptation ou refus.</p>`
      ),
    });

    if (dept.responsableId) {
      const manager = await Employe.findByPk(dept.responsableId);
      if (manager?.isActif) {
        await sendEmail({
          to: manager.email,
          subject: `🆕 Validation compte requise — ${employe.prenom} ${employe.nom}`,
          html: emailTemplates.baseTemplate(
            'Nouvelle demande de compte',
            `<p>Une demande de compte interne est en attente dans votre département <strong>${dept.nom}</strong>.</p>
             <p><strong>Demandeur:</strong> ${employe.prenom} ${employe.nom} (${employe.email})</p>
             <p><strong>Rôle demandé:</strong> ${role}</p>`
          ),
        });
      }
    }

    const rhs = await Employe.findAll({ where: { role: 'Direction_RH', isActif: true } });
    for (const rh of rhs) {
      await sendEmail({
        to: rh.email,
        subject: `🆕 Nouvelle demande de compte — ${employe.prenom} ${employe.nom}`,
        html: emailTemplates.baseTemplate(
          'Demande compte en attente',
          `<p>Nouvelle demande de compte interne.</p>
           <p><strong>Demandeur:</strong> ${employe.prenom} ${employe.nom} (${employe.email})</p>
           <p><strong>Rôle demandé:</strong> ${role}</p>
           <p><strong>Département:</strong> ${dept.nom}</p>`
        ),
      });
    }

    logger.info(`✅ Demande compte créée (en attente) : ${data.email} (${role})`);
    return {
      pending: true,
      message: 'Compte créé et mis en attente. Validation RH ou manager requise.',
    };
  }

  /**
   * Renouveler l'access token via refresh token
   */
  static async refreshToken(token: string) {
    let decoded: { id: number };
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw new AppError(401, 'Refresh token invalide ou expiré.');
    }

    // Chercher dans Employe d'abord
    const employe = await Employe.findOne({
      where: { id: decoded.id, refreshToken: token, isActif: true },
    });

    if (employe) {
      const tokens = generateTokens({
        id: employe.id,
        email: employe.email,
        role: employe.role,
        departementId: employe.departementId,
      });
      await employe.update({ refreshToken: tokens.refreshToken });
      return tokens;
    }

    // Chercher dans Stagiaire
    const stagiaire = await Stagiaire.findOne({
      where: { id: decoded.id, refreshToken: token },
    });

    if (!stagiaire) {
      throw new AppError(401, 'Session invalide. Veuillez vous reconnecter.');
    }

    const tokens = generateTokens({
      id: stagiaire.id,
      email: stagiaire.email,
      role: 'Stagiaire',
    });
    await stagiaire.update({ refreshToken: tokens.refreshToken });
    return tokens;
  }

  /**
   * Déconnexion (invalider le refresh token)
   */
  static async logout(userId: number, role: string) {
    if (role === 'Stagiaire') {
      await Stagiaire.update({ refreshToken: undefined }, { where: { id: userId } });
    } else {
      await Employe.update({ refreshToken: undefined }, { where: { id: userId } });
    }
    logger.info(`👋 Déconnexion : utilisateur ID ${userId}`);
  }

  /**
   * Profil complet pour /auth/me (hors JWT : estFormateur, badges, etc.)
   */
  static async getMeFull(userId: number, role: string) {
    if (role === 'Stagiaire') {
      const s = await Stagiaire.findByPk(userId, {
        include: [{ model: Departement, as: 'departement', attributes: ['id', 'nom', 'code'] }],
      });
      if (!s) {
        throw new AppError(404, 'Utilisateur introuvable.');
      }
      const safe = s.toJSON() as unknown as Record<string, unknown>;
      delete safe.motDePasse;
      delete safe.refreshToken;
      return { ...safe, role: 'Stagiaire' };
    }

    const employe = await Employe.findByPk(userId, {
      include: [{ model: Departement, as: 'departement', attributes: ['id', 'nom', 'code'] }],
    });
    if (!employe) {
      throw new AppError(404, 'Utilisateur introuvable.');
    }
    return employe.toSafeObject();
  }
}
