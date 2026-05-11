"use strict";
// ============================================
// Fichier : services/auth.service.ts
// Description : Service d'authentification JWT + RBAC
// Gère login, register, refresh token pour tous les rôles
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const models_1 = require("../models");
const jwt_1 = require("../config/jwt");
const error_middleware_1 = require("../middlewares/error.middleware");
const logger_1 = require("../config/logger");
const otp_service_1 = require("./otp.service");
const email_1 = require("../config/email");
const roles_1 = require("../constants/roles");
class AuthService {
    /**
     * Connexion d'un employé (tous rôles sauf Stagiaire)
     */
    static async loginEmploye(email, password) {
        const employe = await models_1.Employe.findOne({
            where: { email },
            include: [{ model: models_1.Departement, as: 'departement', attributes: ['id', 'nom', 'code'] }],
        });
        if (!employe) {
            throw new error_middleware_1.AppError(401, 'Email ou mot de passe incorrect.');
        }
        if (!employe.isActif) {
            throw new error_middleware_1.AppError(403, 'Compte créé, en attente de validation RH/Manager.');
        }
        const isValid = await employe.comparePassword(password);
        if (!isValid) {
            logger_1.logger.warn(`Tentative de connexion échouée pour : ${email}`);
            throw new error_middleware_1.AppError(401, 'Email ou mot de passe incorrect.');
        }
        const tokens = (0, jwt_1.generateTokens)({
            id: employe.id,
            email: employe.email,
            role: employe.role,
            departementId: employe.departementId,
        });
        // Sauvegarder le refresh token
        await employe.update({ refreshToken: tokens.refreshToken });
        logger_1.logger.info(`✅ Connexion réussie : ${email} (${employe.role})`);
        return {
            user: employe.toSafeObject(),
            ...tokens,
        };
    }
    /**
     * Inscription d'un nouvel utilisateur
     */
    static async register(data) {
        const registerOtpRequired = process.env.REGISTER_OTP_REQUIRED !== 'false';
        if (registerOtpRequired) {
            const token = data.otpVerificationToken;
            if (!token) {
                throw new error_middleware_1.AppError(400, 'Vérification e-mail requise : demandez un code OTP puis validez-le avant de créer le compte.');
            }
            (0, otp_service_1.verifyOtpProofToken)(token, data.email, 'register');
        }
        delete data.otpVerificationToken;
        // Vérifier si l'email existe déjà
        const exists = await models_1.Employe.findOne({ where: { email: data.email } });
        if (exists) {
            throw new error_middleware_1.AppError(409, 'Un compte avec cet email existe déjà.');
        }
        const role = data.role || 'Employe';
        if (!roles_1.PUBLIC_REGISTER_ROLES.includes(role)) {
            throw new error_middleware_1.AppError(400, 'Rôle non autorisé via cette inscription publique.');
        }
        const dept = await models_1.Departement.findByPk(data.departementId);
        if (!dept) {
            throw new error_middleware_1.AppError(404, 'Département introuvable.');
        }
        const employe = await models_1.Employe.create({
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
        await (0, email_1.sendEmail)({
            to: employe.email,
            subject: '✅ Demande de compte reçue — en attente de validation',
            html: email_1.emailTemplates.baseTemplate('Demande enregistrée', `<p>Bonjour <strong>${employe.prenom} ${employe.nom}</strong>,</p>
         <p>Votre demande de compte a bien été reçue.</p>
         <p>Statut: <strong>en attente de validation</strong> par la RH ou le manager du département <strong>${dept.nom}</strong>.</p>
         <p>Vous recevrez un e-mail après acceptation ou refus.</p>`),
        });
        if (dept.responsableId) {
            const manager = await models_1.Employe.findByPk(dept.responsableId);
            if (manager?.isActif) {
                await (0, email_1.sendEmail)({
                    to: manager.email,
                    subject: `🆕 Validation compte requise — ${employe.prenom} ${employe.nom}`,
                    html: email_1.emailTemplates.baseTemplate('Nouvelle demande de compte', `<p>Une demande de compte interne est en attente dans votre département <strong>${dept.nom}</strong>.</p>
             <p><strong>Demandeur:</strong> ${employe.prenom} ${employe.nom} (${employe.email})</p>
             <p><strong>Rôle demandé:</strong> ${role}</p>`),
                });
            }
        }
        const rhs = await models_1.Employe.findAll({ where: { role: 'Direction_RH', isActif: true } });
        for (const rh of rhs) {
            await (0, email_1.sendEmail)({
                to: rh.email,
                subject: `🆕 Nouvelle demande de compte — ${employe.prenom} ${employe.nom}`,
                html: email_1.emailTemplates.baseTemplate('Demande compte en attente', `<p>Nouvelle demande de compte interne.</p>
           <p><strong>Demandeur:</strong> ${employe.prenom} ${employe.nom} (${employe.email})</p>
           <p><strong>Rôle demandé:</strong> ${role}</p>
           <p><strong>Département:</strong> ${dept.nom}</p>`),
            });
        }
        logger_1.logger.info(`✅ Demande compte créée (en attente) : ${data.email} (${role})`);
        return {
            pending: true,
            message: 'Compte créé et mis en attente. Validation RH ou manager requise.',
        };
    }
    /**
     * Renouveler l'access token via refresh token
     */
    static async refreshToken(token) {
        let decoded;
        try {
            decoded = (0, jwt_1.verifyRefreshToken)(token);
        }
        catch {
            throw new error_middleware_1.AppError(401, 'Refresh token invalide ou expiré.');
        }
        // Chercher dans Employe d'abord
        const employe = await models_1.Employe.findOne({
            where: { id: decoded.id, refreshToken: token, isActif: true },
        });
        if (employe) {
            const tokens = (0, jwt_1.generateTokens)({
                id: employe.id,
                email: employe.email,
                role: employe.role,
                departementId: employe.departementId,
            });
            await employe.update({ refreshToken: tokens.refreshToken });
            return tokens;
        }
        // Chercher dans Stagiaire
        const stagiaire = await models_1.Stagiaire.findOne({
            where: { id: decoded.id, refreshToken: token },
        });
        if (!stagiaire) {
            throw new error_middleware_1.AppError(401, 'Session invalide. Veuillez vous reconnecter.');
        }
        const tokens = (0, jwt_1.generateTokens)({
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
    static async logout(userId, role) {
        if (role === 'Stagiaire') {
            await models_1.Stagiaire.update({ refreshToken: undefined }, { where: { id: userId } });
        }
        else {
            await models_1.Employe.update({ refreshToken: undefined }, { where: { id: userId } });
        }
        logger_1.logger.info(`👋 Déconnexion : utilisateur ID ${userId}`);
    }
    /**
     * Profil complet pour /auth/me (hors JWT : estFormateur, badges, etc.)
     */
    static async getMeFull(userId, role) {
        if (role === 'Stagiaire') {
            const s = await models_1.Stagiaire.findByPk(userId, {
                include: [{ model: models_1.Departement, as: 'departement', attributes: ['id', 'nom', 'code'] }],
            });
            if (!s) {
                throw new error_middleware_1.AppError(404, 'Utilisateur introuvable.');
            }
            const safe = s.toJSON();
            delete safe.motDePasse;
            delete safe.refreshToken;
            return { ...safe, role: 'Stagiaire' };
        }
        const employe = await models_1.Employe.findByPk(userId, {
            include: [{ model: models_1.Departement, as: 'departement', attributes: ['id', 'nom', 'code'] }],
        });
        if (!employe) {
            throw new error_middleware_1.AppError(404, 'Utilisateur introuvable.');
        }
        return employe.toSafeObject();
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map