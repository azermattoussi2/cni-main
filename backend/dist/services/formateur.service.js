"use strict";
// ============================================
// Fichier : services/formateur.service.ts
// Description : Service métier - Module Formateurs
// Workflows 9-14 : notification opportunité, matching, réponse, profil, gamification
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormateurService = void 0;
const models_1 = require("../models");
const email_1 = require("../config/email");
const error_middleware_1 = require("../middlewares/error.middleware");
const logger_1 = require("../config/logger");
const sequelize_1 = require("sequelize");
const workflow_audit_1 = require("../utils/workflow-audit");
class FormateurService {
    // ============================================
    // WORKFLOW 9 : Notification opportunité formateur
    // ============================================
    /**
     * Notifier les formateurs internes qualifiés d'une opportunité
     * Algorithme de matching : compare domaines formation ↔ compétences formateur
     */
    static async notifierOpportunite(formationId) {
        const formation = await models_1.Formation.findByPk(formationId);
        if (!formation)
            throw new error_middleware_1.AppError(404, 'Formation introuvable.');
        // Trouver les formateurs internes disponibles avec les compétences requises
        const formateurs = await models_1.Employe.findAll({
            where: { estFormateur: true, isActif: true },
        });
        const qualifies = [];
        for (const f of formateurs) {
            const score = this.calculerScoreMatching(f, formation);
            if (score > 0)
                qualifies.push({ formateur: f, score });
        }
        // Trier par score décroissant
        qualifies.sort((a, b) => b.score - a.score);
        // Envoyer les notifications avec date limite 3 jours
        const dateLimite = new Date();
        dateLimite.setDate(dateLimite.getDate() + 3);
        let notifEnvoyees = 0;
        for (const { formateur, score } of qualifies.slice(0, 5)) { // max 5 formateurs notifiés
            const demande = await models_1.DemandeFormateur.create({
                formateurId: formateur.id,
                formationId,
                dateLimiteReponse: dateLimite,
                messagePersonnalise: `Score de compatibilité : ${score}/10`,
            });
            await (0, email_1.sendEmail)({
                to: formateur.email,
                subject: `🎯 Opportunité de formation - ${formation.titre}`,
                html: email_1.emailTemplates.baseTemplate('Nouvelle opportunité de formation', `<p>Bonjour <strong>${formateur.prenom} ${formateur.nom}</strong>,</p>
           <p>Votre profil correspond à la formation <strong>${formation.titre}</strong>.</p>
           <p><strong>Domaine :</strong> ${formation.domaine}<br>
           <strong>Durée :</strong> ${formation.dureeJours || '?'} jour(s)<br>
           <strong>Date limite de réponse :</strong> ${dateLimite.toLocaleDateString('fr-FR')}</p>`, 'Voir l\'opportunité', `${process.env.FRONTEND_URL}/formateur/opportunites/${demande.id}`),
            });
            notifEnvoyees++;
            logger_1.logger.info(`📧 Opportunité notifiée : formateur #${formateur.id} → formation #${formationId} (score: ${score})`);
            (0, workflow_audit_1.logWorkflowEvent)({
                workflow: 'formateur-notification-opportunite',
                entity: 'demande_formateur',
                entityId: demande.id,
                action: 'notification_envoyee',
                metadata: { formateurId: formateur.id, formationId, score },
            });
        }
        return { notifEnvoyees, formateursQualifies: qualifies.length };
    }
    // ============================================
    // WORKFLOW 12 : Algorithme de matching
    // ============================================
    /**
     * Calcule un score de compatibilité formateur ↔ formation (0-10)
     */
    static calculerScoreMatching(formateur, formation) {
        let score = 0;
        // Compétences correspondantes
        if (formateur.domainesCompetences) {
            const competences = JSON.parse(formateur.domainesCompetences);
            if (competences.some(c => c.toLowerCase().includes(formation.domaine.toLowerCase()))) {
                score += 5;
            }
            if (competences.some(c => formation.titre.toLowerCase().includes(c.toLowerCase()))) {
                score += 2;
            }
        }
        // Disponibilité
        if (formateur.disponibiliteHeures && formateur.disponibiliteHeures > 0) {
            score += 2;
        }
        // Expérience (note formateur)
        if (formateur.noteFormateur && formateur.noteFormateur >= 4) {
            score += 1;
        }
        return Math.min(score, 10);
    }
    // ============================================
    // WORKFLOW 10 : Réponse formateur
    // ============================================
    /**
     * Formateur accepte ou refuse une opportunité
     */
    static async repondreOpportunite(demandeId, formateurId, action, commentaire) {
        const demande = await models_1.DemandeFormateur.findByPk(demandeId, {
            include: [{ model: models_1.Formation, as: 'formation' }],
        });
        if (!demande)
            throw new error_middleware_1.AppError(404, 'Demande introuvable.');
        if (demande.formateurId !== formateurId)
            throw new error_middleware_1.AppError(403, 'Accès refusé.');
        if (demande.statut !== 'En_attente')
            throw new error_middleware_1.AppError(400, 'Cette demande a déjà été traitée.');
        const formateur = await models_1.Employe.findByPk(formateurId);
        if (!formateur || !formateur.estFormateur) {
            throw new error_middleware_1.AppError(403, 'Seul un formateur interne peut répondre à cette opportunité.');
        }
        const maintenant = new Date();
        if (maintenant > new Date(demande.dateLimiteReponse)) {
            await demande.update({ statut: 'Expiree' });
            throw new error_middleware_1.AppError(400, 'Date limite de réponse dépassée.');
        }
        const formation = demande.formation;
        if (action === 'refuser') {
            await demande.update({ statut: 'Refusee', dateReponse: maintenant, commentaireRefus: commentaire });
            // Notifier RH du refus
            const rhUsers = await models_1.Employe.findAll({ where: { role: 'Direction_RH', isActif: true } });
            for (const rh of rhUsers) {
                await (0, email_1.sendEmail)({
                    to: rh.email,
                    subject: `ℹ️ Refus formateur - ${formation.titre}`,
                    html: email_1.emailTemplates.baseTemplate('Formateur a refusé', `<p>Un formateur a refusé l'opportunité pour <strong>${formation.titre}</strong>. Vous pouvez lancer une nouvelle recherche.</p>`, 'Trouver un formateur', `${process.env.FRONTEND_URL}/rh/formateurs/matching/${formation.id}`),
                });
            }
            return { message: 'Refus enregistré.', demande };
        }
        // Acceptation
        await demande.update({ statut: 'Acceptee', dateReponse: maintenant });
        // Assigner le formateur à la formation
        await formation.update({ formateurId });
        // Attribution compensation
        const compensation = await this.calculerCompensation(formateurId, formation);
        await demande.update({
            compensationPrime: compensation.prime,
            compensationHeures: compensation.heures,
        });
        // Notifier RH
        const rhUsers = await models_1.Employe.findAll({ where: { role: 'Direction_RH', isActif: true } });
        for (const rh of rhUsers) {
            await (0, email_1.sendEmail)({
                to: rh.email,
                subject: `✅ Formateur confirmé - ${formation.titre}`,
                html: email_1.emailTemplates.baseTemplate('Formateur confirmé', `<p>Un formateur interne a accepté d'animer la formation <strong>${formation.titre}</strong>.</p>`),
            });
        }
        logger_1.logger.info(`✅ Formateur #${formateurId} accepté pour formation #${formation.id}`);
        (0, workflow_audit_1.logWorkflowEvent)({
            workflow: 'formateur-reponse-traitement',
            entity: 'demande_formateur',
            entityId: demande.id,
            action: action === 'accepter' ? 'acceptee' : 'refusee',
            actorId: formateurId,
            metadata: { formationId: formation.id },
        });
        return { message: 'Opportunité acceptée.', demande, compensation };
    }
    // ============================================
    // WORKFLOW 14 : Gamification
    // ============================================
    /**
     * Attribuer des badges selon les performances
     */
    static async attribuerBadges(formateurId) {
        const formateur = await models_1.Employe.findByPk(formateurId);
        if (!formateur || !formateur.estFormateur)
            return;
        const badges = formateur.badges ? JSON.parse(formateur.badges) : [];
        const totalHeures = formateur.totalHeuresFormation || 0;
        const note = formateur.noteFormateur || 0;
        const badgesAttribues = [];
        if (totalHeures >= 10 && !badges.includes('Formateur 10h')) {
            badges.push('Formateur 10h');
            badgesAttribues.push('Formateur 10h');
        }
        if (totalHeures >= 50 && !badges.includes('Formateur 50h')) {
            badges.push('Formateur 50h');
            badgesAttribues.push('Formateur 50h');
        }
        if (totalHeures >= 100 && !badges.includes('Expert 100h')) {
            badges.push('Expert 100h');
            badgesAttribues.push('Expert 100h');
        }
        if (note >= 4.5 && !badges.includes('Étoile d\'Or')) {
            badges.push('Étoile d\'Or');
            badgesAttribues.push('Étoile d\'Or');
        }
        if (badgesAttribues.length > 0) {
            await formateur.update({ badges: JSON.stringify(badges) });
            await (0, email_1.sendEmail)({
                to: formateur.email,
                subject: `🏅 Nouveau badge obtenu ! - CNI`,
                html: email_1.emailTemplates.baseTemplate('Félicitations ! Nouveau badge obtenu', `<p>Vous avez obtenu ${badgesAttribues.length > 1 ? 'de nouveaux badges' : 'un nouveau badge'} :<br>
           <strong>${badgesAttribues.join(', ')}</strong></p>`),
            });
            logger_1.logger.info(`🏅 Badges attribués à ${formateur.nom} : ${badgesAttribues.join(', ')}`);
        }
        return { badges, nouveauxBadges: badgesAttribues };
    }
    /**
     * Calculer la compensation pour un formateur
     */
    static async calculerCompensation(formateurId, formation) {
        const heures = (formation.dureeHeures || (formation.dureeJours || 1) * 8);
        const prime = heures * 50; // 50 TND/heure (configurable)
        return { prime, heures };
    }
    // ============================================
    // WORKFLOW 11 : Mise à jour profil formateur
    // ============================================
    static async inscrireCommeFormateur(employeId, data) {
        const employe = await models_1.Employe.findByPk(employeId);
        if (!employe)
            throw new error_middleware_1.AppError(404, 'Employé introuvable.');
        await employe.update({
            estFormateur: true,
            domainesCompetences: JSON.stringify(data.domainesCompetences),
            disponibiliteHeures: data.disponibiliteHeures,
        });
        // Notifier RH
        const rhUsers = await models_1.Employe.findAll({ where: { role: 'Direction_RH', isActif: true } });
        for (const rh of rhUsers) {
            await (0, email_1.sendEmail)({
                to: rh.email,
                subject: `🎓 Nouvel inscription formateur interne - ${employe.prenom} ${employe.nom}`,
                html: email_1.emailTemplates.baseTemplate('Nouveau formateur interne', `<p><strong>${employe.prenom} ${employe.nom}</strong> s'est inscrit comme formateur interne.</p>
           <p><strong>Compétences :</strong> ${data.domainesCompetences.join(', ')}</p>
           <p><strong>Disponibilité :</strong> ${data.disponibiliteHeures}h/mois</p>`),
            });
        }
        logger_1.logger.info(`🎓 Nouveau formateur interne : ${employe.nom} #${employeId}`);
        return employe;
    }
    static async getFormateursInternes(filtres = {}, user) {
        const where = { estFormateur: true };
        const gestion = filtres.listMode === 'gestion' && user && ['Direction_RH', 'Manager'].includes(user.role);
        if (!gestion) {
            where.isActif = true;
            where.isArchived = false;
            if (filtres.domaine) {
                where.domainesCompetences = { [sequelize_1.Op.like]: `%${filtres.domaine}%` };
            }
        }
        else {
            if (user.role === 'Manager' && user.departementId) {
                where.departementId = user.departementId;
            }
            const f = filtres;
            if (f.isActif === 'true')
                where.isActif = true;
            else if (f.isActif === 'false')
                where.isActif = false;
            if (f.isArchived === 'true')
                where.isArchived = true;
            else if (f.isArchived === 'false')
                where.isArchived = false;
            else if (f.includeArchived !== '1')
                where.isArchived = false;
            if (f.search?.trim()) {
                const term = `%${f.search.trim()}%`;
                where[sequelize_1.Op.or] = [
                    { nom: { [sequelize_1.Op.like]: term } },
                    { prenom: { [sequelize_1.Op.like]: term } },
                    { email: { [sequelize_1.Op.like]: term } },
                ];
            }
            if (filtres.domaine) {
                where.domainesCompetences = { [sequelize_1.Op.like]: `%${filtres.domaine}%` };
            }
        }
        return models_1.Employe.findAll({
            where,
            attributes: { exclude: ['motDePasse', 'refreshToken'] },
            include: [{ model: models_1.Departement, as: 'departement', attributes: ['id', 'nom', 'code'] }],
            order: [['nom', 'ASC']],
        });
    }
    static async getFormateurInterneById(id) {
        const e = await models_1.Employe.findOne({
            where: { id, estFormateur: true },
            attributes: { exclude: ['motDePasse', 'refreshToken'] },
            include: [{ model: models_1.Departement, as: 'departement', attributes: ['id', 'nom'] }],
        });
        if (!e)
            throw new error_middleware_1.AppError(404, 'Formateur introuvable.');
        return e;
    }
    static async createFormateurInterne(data) {
        const exists = await models_1.Employe.findOne({ where: { email: data.email } });
        if (exists)
            throw new error_middleware_1.AppError(400, 'Un compte existe déjà avec cet email.');
        const created = await models_1.Employe.create({
            nom: data.nom,
            prenom: data.prenom,
            email: data.email,
            motDePasse: data.motDePasse,
            departementId: data.departementId,
            poste: data.poste,
            telephone: data.telephone,
            role: 'Formateur_Interne',
            estFormateur: true,
            domainesCompetences: JSON.stringify(data.domainesCompetences),
            disponibiliteHeures: data.disponibiliteHeures,
            isActif: true,
            isArchived: false,
        });
        const full = await models_1.Employe.findByPk(created.id, {
            attributes: { exclude: ['motDePasse', 'refreshToken'] },
            include: [{ model: models_1.Departement, as: 'departement', attributes: ['id', 'nom'] }],
        });
        if (!full)
            throw new error_middleware_1.AppError(500, 'Erreur lors de la création du formateur.');
        logger_1.logger.info(`🎓 Formateur interne créé (admin) : ${full.prenom} ${full.nom} #${full.id}`);
        return full;
    }
    static async updateFormateurInterne(id, data) {
        const e = await models_1.Employe.findOne({ where: { id, estFormateur: true } });
        if (!e)
            throw new error_middleware_1.AppError(404, 'Formateur introuvable.');
        if (data.email && data.email !== e.email) {
            const exists = await models_1.Employe.findOne({ where: { email: data.email } });
            if (exists)
                throw new error_middleware_1.AppError(400, 'Email déjà utilisé.');
        }
        const updatePayload = {};
        if (data.nom !== undefined)
            updatePayload.nom = data.nom;
        if (data.prenom !== undefined)
            updatePayload.prenom = data.prenom;
        if (data.email !== undefined)
            updatePayload.email = data.email;
        if (data.poste !== undefined)
            updatePayload.poste = data.poste;
        if (data.telephone !== undefined)
            updatePayload.telephone = data.telephone;
        if (data.departementId !== undefined)
            updatePayload.departementId = data.departementId;
        if (data.disponibiliteHeures !== undefined)
            updatePayload.disponibiliteHeures = data.disponibiliteHeures;
        if (data.isActif !== undefined)
            updatePayload.isActif = data.isActif;
        if (data.isArchived !== undefined) {
            updatePayload.isArchived = data.isArchived;
            if (data.isArchived === true)
                updatePayload.isActif = false;
        }
        if (data.domainesCompetences !== undefined) {
            updatePayload.domainesCompetences = JSON.stringify(data.domainesCompetences);
        }
        if (data.motDePasse)
            updatePayload.motDePasse = data.motDePasse;
        await e.update(updatePayload);
        const updated = await models_1.Employe.findByPk(id, {
            attributes: { exclude: ['motDePasse', 'refreshToken'] },
            include: [{ model: models_1.Departement, as: 'departement', attributes: ['id', 'nom'] }],
        });
        if (!updated)
            throw new error_middleware_1.AppError(500, 'Erreur lors de la mise à jour.');
        logger_1.logger.info(`🎓 Formateur interne mis à jour (admin) : #${id}`);
        return updated;
    }
    static async getDashboardFormateur(formateurId) {
        const formateur = await models_1.Employe.findByPk(formateurId, {
            attributes: { exclude: ['motDePasse', 'refreshToken'] },
        });
        if (!formateur)
            throw new error_middleware_1.AppError(404, 'Formateur introuvable.');
        const demandes = await models_1.DemandeFormateur.findAll({
            where: { formateurId },
            include: [{ model: models_1.Formation, as: 'formation' }],
            order: [['createdAt', 'DESC']],
        });
        const statsFormations = await models_1.Formation.findAll({
            where: { formateurId },
        });
        return {
            profil: formateur,
            demandes,
            totalFormations: statsFormations.length,
            totalHeures: formateur.totalHeuresFormation || 0,
            noteMoyenne: formateur.noteFormateur || 0,
            badges: formateur.badges ? JSON.parse(formateur.badges) : [],
        };
    }
}
exports.FormateurService = FormateurService;
//# sourceMappingURL=formateur.service.js.map