"use strict";
// ============================================
// Fichier : services/formation.service.ts
// Description : Service métier - Module Formations
// Workflows : demande, inscription, organisation, évaluation, budget
// Conforme au cahier des charges section 3.2 et 7 (workflows 5-8 + 15)
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormationService = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const email_1 = require("../config/email");
const pdf_service_1 = require("./pdf.service");
const error_middleware_1 = require("../middlewares/error.middleware");
const logger_1 = require("../config/logger");
const workflow_audit_1 = require("../utils/workflow-audit");
class FormationService {
    static async getPublicCatalog() {
        return models_1.Formation.findAll({
            where: { isActif: true, statut: 'Publiee' },
            attributes: ['id', 'titre', 'description', 'domaine', 'type', 'dateDebut', 'dateFin', 'formateurId', 'formateurNom'],
            order: [['dateDebut', 'ASC']],
        });
    }
    // ============================================
    // WORKFLOW 5 : Demande de formation
    // ============================================
    /**
     * Créer une demande d'inscription à une formation
     * Vérifie : budget département, places disponibles, doublons
     */
    static async demanderInscription(employeId, formationId) {
        const employe = await models_1.Employe.findByPk(employeId, {
            include: [{ model: models_1.Departement, as: 'departement' }],
        });
        if (!employe)
            throw new error_middleware_1.AppError(404, 'Employé introuvable.');
        const formation = await models_1.Formation.findByPk(formationId);
        if (!formation)
            throw new error_middleware_1.AppError(404, 'Formation introuvable.');
        if (formation.statut !== 'Publiee') {
            throw new error_middleware_1.AppError(400, 'Cette formation n\'est pas disponible à l\'inscription.');
        }
        const existant = await models_1.InscriptionFormation.findOne({ where: { employeId, formationId } });
        if (existant) {
            const statutsReinscription = ['Refusee', 'Annulee'];
            if (!statutsReinscription.includes(existant.statut)) {
                throw new error_middleware_1.AppError(409, 'Une demande est déjà en cours pour cette formation.');
            }
        }
        // Vérifier budget département
        let listAttente = false;
        if (formation.cout && employe.departementId) {
            const dept = await models_1.Departement.findByPk(employe.departementId);
            if (dept && Number(dept.budgetRestant) < Number(formation.cout)) {
                throw new error_middleware_1.AppError(400, `Budget insuffisant. Budget restant : ${dept.budgetRestant} TND, coût formation : ${formation.cout} TND`);
            }
        }
        // Vérifier places disponibles
        if (formation.maxParticipants && formation.nbInscrits >= formation.maxParticipants) {
            listAttente = true;
        }
        const nouveauStatut = listAttente ? 'Liste_attente' : 'En_attente_manager';
        let inscription;
        if (existant) {
            await existant.update({
                statut: nouveauStatut,
                dateDemandeEmploye: new Date(),
                managerId: null,
                dateValidationManager: null,
                dateValidationRH: null,
                commentaireManager: null,
                commentaireRH: null,
                commentaireRefus: null,
            });
            await existant.reload();
            inscription = existant;
        }
        else {
            inscription = await models_1.InscriptionFormation.create({
                employeId,
                formationId,
                statut: nouveauStatut,
            });
        }
        if (listAttente) {
            await (0, email_1.sendEmail)({
                to: employe.email,
                subject: `Liste d'attente - ${formation.titre}`,
                html: email_1.emailTemplates.baseTemplate('Inscription en liste d\'attente', `<p>La formation <strong>${formation.titre}</strong> est complète. Vous avez été ajouté à la liste d'attente.</p>`),
            });
            return { message: 'Ajouté à la liste d\'attente.', inscription };
        }
        // Notifier le manager pour validation
        if (employe.departementId) {
            const dept = await models_1.Departement.findByPk(employe.departementId);
            if (dept?.responsableId) {
                const manager = await models_1.Employe.findByPk(dept.responsableId);
                if (manager) {
                    await (0, email_1.sendEmail)({
                        to: manager.email,
                        subject: `✅ Validation requise - Demande formation de ${employe.prenom} ${employe.nom}`,
                        html: email_1.emailTemplates.baseTemplate('Demande de formation à valider', `<p><strong>${employe.prenom} ${employe.nom}</strong> demande à participer à la formation :<br>
               <strong>${formation.titre}</strong></p>
               <p>Domaine : ${formation.domaine} | Durée : ${formation.dureeJours || '?'} jour(s) | Coût : ${formation.cout || '?'} TND</p>`, 'Valider la demande', `${process.env.FRONTEND_URL}/manager/formations/validations/${inscription.id}`),
                    });
                }
            }
        }
        logger_1.logger.info(`📝 Demande inscription formation #${formationId} par employé #${employeId}`);
        (0, workflow_audit_1.logWorkflowEvent)({
            workflow: 'formation-demande',
            entity: 'inscription',
            entityId: inscription.id,
            action: listAttente ? 'liste_attente' : existant ? 'reprise_apres_refus' : 'soumise_manager',
            actorId: employeId,
            metadata: { formationId },
        });
        const msg = existant
            ? 'Nouvelle demande soumise au manager pour validation.'
            : 'Demande soumise au manager pour validation.';
        return { message: msg, inscription };
    }
    // ============================================
    // WORKFLOW 6 : Validation inscription
    // ============================================
    /**
     * Validation Manager → RH
     */
    static async validerManager(inscriptionId, managerId, action, commentaire) {
        const inscription = await models_1.InscriptionFormation.findByPk(inscriptionId, {
            include: [
                { model: models_1.Employe, as: 'employe' },
                { model: models_1.Formation, as: 'formation' },
            ],
        });
        if (!inscription)
            throw new error_middleware_1.AppError(404, 'Inscription introuvable.');
        if (inscription.statut !== 'En_attente_manager') {
            throw new error_middleware_1.AppError(400, 'Cette inscription n\'est pas en attente de validation manager.');
        }
        const employe = inscription.employe;
        const formation = inscription.formation;
        if (action === 'refuser') {
            await inscription.update({
                statut: 'Refusee',
                managerId,
                commentaireManager: commentaire,
                dateValidationManager: new Date(),
                commentaireRefus: commentaire,
            });
            await (0, email_1.sendEmail)({
                to: employe.email,
                subject: `Demande de formation refusée - ${formation.titre}`,
                html: email_1.emailTemplates.baseTemplate('Demande non approuvée', `<p>Votre demande pour la formation <strong>${formation.titre}</strong> a été refusée par votre manager.</p>
           ${commentaire ? `<p><strong>Motif :</strong> ${commentaire}</p>` : ''}`),
            });
            return { message: 'Inscription refusée.', inscription };
        }
        await inscription.update({
            statut: 'En_attente_RH',
            managerId,
            commentaireManager: commentaire,
            dateValidationManager: new Date(),
        });
        (0, workflow_audit_1.logWorkflowEvent)({
            workflow: 'formation-inscription',
            entity: 'inscription',
            entityId: inscription.id,
            action: 'valide_manager',
            actorId: managerId,
            metadata: { formationId: formation.id },
        });
        // Notifier RH
        const rhUsers = await models_1.Employe.findAll({ where: { role: 'Direction_RH', isActif: true } });
        for (const rh of rhUsers) {
            await (0, email_1.sendEmail)({
                to: rh.email,
                subject: `🔍 Validation finale requise - ${employe.prenom} ${employe.nom} → ${formation.titre}`,
                html: email_1.emailTemplates.baseTemplate('Validation RH requise', `<p><strong>${employe.prenom} ${employe.nom}</strong> a obtenu la validation manager pour :<br>
           <strong>${formation.titre}</strong></p>`, 'Valider', `${process.env.FRONTEND_URL}/rh/formations/validations/${inscriptionId}`),
            });
        }
        return { message: 'Transmis à la RH pour validation finale.', inscription };
    }
    /**
     * Lorsqu’un formateur externe est accepté (place confirmée ou liste d’attente), refuser les autres
     * demandes de formateurs externes pour la même formation (statuts encore chez manager ou RH).
     */
    static async refuserAutresFormateursExternesPourFormation(formationId, inscriptionGardeId) {
        const autres = await models_1.InscriptionFormation.findAll({
            where: {
                formationId,
                id: { [sequelize_1.Op.ne]: inscriptionGardeId },
                statut: { [sequelize_1.Op.in]: ['En_attente_manager', 'En_attente_RH'] },
            },
            include: [
                {
                    model: models_1.Employe,
                    as: 'employe',
                    required: true,
                    where: { role: 'Formateur_Externe' },
                },
            ],
        });
        const motif = 'Un autre formateur externe a été retenu pour cette formation (décision RH).';
        let n = 0;
        for (const row of autres) {
            const emp = row.employe;
            await row.update({
                statut: 'Refusee',
                commentaireRefus: motif,
                commentaireRH: motif,
                dateValidationRH: new Date(),
            });
            await (0, email_1.sendEmail)({
                to: emp.email,
                subject: `Demande de formation — ${motif}`,
                html: email_1.emailTemplates.baseTemplate('Demande non retenue', `<p>Votre demande pour une formation ne peut pas être poursuivie : ${motif}</p>`),
            });
            n++;
        }
        if (n > 0) {
            logger_1.logger.info(`Auto-refus de ${n} autre(s) demande(s) formateur externe pour formation #${formationId}`);
        }
        return n;
    }
    /**
     * Validation finale RH → inscription confirmée
     */
    static async validerRH(inscriptionId, action, commentaire) {
        const inscription = await models_1.InscriptionFormation.findByPk(inscriptionId, {
            include: [
                { model: models_1.Employe, as: 'employe' },
                { model: models_1.Formation, as: 'formation' },
            ],
        });
        if (!inscription)
            throw new error_middleware_1.AppError(404, 'Inscription introuvable.');
        if (inscription.statut !== 'En_attente_RH') {
            throw new error_middleware_1.AppError(400, 'Cette inscription n\'est pas en attente de validation RH.');
        }
        const employe = inscription.employe;
        const formation = inscription.formation;
        if (action === 'refuser') {
            await inscription.update({
                statut: 'Refusee',
                commentaireRH: commentaire,
                commentaireRefus: commentaire,
                dateValidationRH: new Date(),
            });
            await (0, email_1.sendEmail)({
                to: employe.email,
                subject: `Demande de formation refusée par la RH - ${formation.titre}`,
                html: email_1.emailTemplates.baseTemplate('Demande refusée', `<p>Votre demande pour <strong>${formation.titre}</strong> a été refusée par la RH.</p>
           ${commentaire ? `<p><strong>Motif :</strong> ${commentaire}</p>` : ''}`),
            });
            return { message: 'Refusée.', inscription };
        }
        // Vérifier places
        let statut = 'Validee';
        if (formation.maxParticipants && formation.nbInscrits >= formation.maxParticipants) {
            statut = 'Liste_attente';
        }
        await inscription.update({
            statut,
            dateValidationRH: new Date(),
            commentaireRH: commentaire,
            budgetDepartementImpacte: true,
        });
        if (statut === 'Validee') {
            // Incrémenter le compteur de la formation
            await formation.increment('nbInscrits');
            // Impacter le budget département
            if (employe.departementId && formation.coutParParticipant) {
                await this.impacterBudget(employe.departementId, Number(formation.coutParParticipant));
            }
            await (0, email_1.sendEmail)({
                to: employe.email,
                subject: `🎓 Inscription confirmée - ${formation.titre}`,
                html: email_1.emailTemplates.baseTemplate('Votre inscription est confirmée !', `<p>Votre inscription à la formation <strong>${formation.titre}</strong> est validée !</p>
           ${formation.dateDebut ? `<p><strong>Date :</strong> ${new Date(formation.dateDebut).toLocaleDateString('fr-FR')}</p>` : ''}
           ${formation.lieu ? `<p><strong>Lieu :</strong> ${formation.lieu}</p>` : ''}`, 'Voir ma formation', `${process.env.FRONTEND_URL}/employe/formations/${formation.id}`),
            });
        }
        logger_1.logger.info(`✅ Inscription validée RH : employé #${employe.id} → formation #${formation.id}`);
        (0, workflow_audit_1.logWorkflowEvent)({
            workflow: 'formation-inscription',
            entity: 'inscription',
            entityId: inscription.id,
            action: statut === 'Validee' ? 'valide_rh' : 'liste_attente_rh',
            metadata: { employeId: employe.id, formationId: formation.id },
        });
        if (employe.role === 'Formateur_Externe' && (statut === 'Validee' || statut === 'Liste_attente')) {
            await FormationService.refuserAutresFormateursExternesPourFormation(formation.id, inscription.id);
        }
        return { message: statut === 'Validee' ? 'Inscription confirmée.' : 'Formation complète, ajouté en liste d\'attente.', inscription };
    }
    /**
     * Acceptation ou refus d’une inscription (manager si En_attente_manager, RH si En_attente_RH).
     * Alias métier pour les API « accept » / « reject ».
     */
    static async decisionInscription(inscriptionId, actorId, actorRole, decision, commentaire) {
        const ins = await models_1.InscriptionFormation.findByPk(inscriptionId);
        if (!ins)
            throw new error_middleware_1.AppError(404, 'Inscription introuvable.');
        const action = decision === 'accept' ? 'valider' : 'refuser';
        if (ins.statut === 'En_attente_manager') {
            if (actorRole !== 'Manager' && actorRole !== 'Direction_RH') {
                throw new error_middleware_1.AppError(403, 'Action réservée au manager ou à la RH.');
            }
            return this.validerManager(inscriptionId, actorId, action, commentaire);
        }
        if (ins.statut === 'En_attente_RH') {
            if (actorRole !== 'Direction_RH') {
                throw new error_middleware_1.AppError(403, 'Action réservée à la RH.');
            }
            return this.validerRH(inscriptionId, action, commentaire);
        }
        throw new error_middleware_1.AppError(400, 'Aucune décision possible pour cette inscription.');
    }
    /**
     * File d’attente validation : manager (département) ou RH (étape RH).
     */
    static async listInscriptionsEnAttente(actorEmployeId, role) {
        const formationInclude = {
            model: models_1.Formation,
            as: 'formation',
            attributes: ['id', 'titre', 'domaine', 'cout', 'dateDebut'],
        };
        const employeIncludeBase = {
            model: models_1.Employe,
            as: 'employe',
            attributes: ['id', 'nom', 'prenom', 'poste', 'departementId', 'role', 'email'],
            include: [{ model: models_1.Departement, as: 'departement', attributes: ['id', 'nom', 'code'] }],
        };
        if (role === 'Direction_RH') {
            return models_1.InscriptionFormation.findAll({
                include: [employeIncludeBase, formationInclude],
                order: [['dateDemandeEmploye', 'DESC']],
            });
        }
        if (role === 'Manager') {
            const mgr = await models_1.Employe.findByPk(actorEmployeId);
            if (!mgr?.departementId)
                return [];
            return models_1.InscriptionFormation.findAll({
                where: { statut: 'En_attente_manager' },
                include: [
                    {
                        ...employeIncludeBase,
                        required: true,
                        where: { departementId: mgr.departementId },
                    },
                    formationInclude,
                ],
                order: [['dateDemandeEmploye', 'ASC']],
            });
        }
        return [];
    }
    // ============================================
    // WORKFLOW 15 : Budget alertes
    // ============================================
    /**
     * Vérifier les budgets et envoyer des alertes à 60%, 80%, 90%
     */
    static async verifierBudgets() {
        const departements = await models_1.Departement.findAll({ where: { isActif: true } });
        let alertesEnvoyees = 0;
        for (const dept of departements) {
            const pct = (Number(dept.budgetUtilise) / Number(dept.budgetFormationAnnuel)) * 100;
            const now = new Date();
            const mois = now.getMonth() + 1;
            const annee = now.getFullYear();
            let budgetEntry = await models_1.BudgetTracker.findOne({
                where: { departementId: dept.id, annee, mois },
            });
            if (!budgetEntry) {
                budgetEntry = await models_1.BudgetTracker.create({
                    departementId: dept.id,
                    annee,
                    mois,
                    budgetAlloue: Number(dept.budgetFormationAnnuel) / 12,
                    budgetUtilise: Number(dept.budgetUtilise),
                });
            }
            const rhUsers = await models_1.Employe.findAll({ where: { role: 'Direction_RH', isActif: true } });
            const manager = dept.responsableId ? await models_1.Employe.findByPk(dept.responsableId) : null;
            const destinataires = [
                ...rhUsers.map(r => r.email),
                ...(manager ? [manager.email] : []),
            ];
            const sendAlerte = async (seuil, field) => {
                if (pct >= seuil && !budgetEntry[field]) {
                    await budgetEntry.update({ [field]: true });
                    for (const email of destinataires) {
                        await (0, email_1.sendEmail)({
                            to: email,
                            subject: `⚠️ Alerte Budget Formation - Département ${dept.nom} (${Math.round(pct)}%)`,
                            html: email_1.emailTemplates.baseTemplate(`Alerte Budget Formation - ${Math.round(pct)}% utilisé`, `<p>Le budget formation du département <strong>${dept.nom}</strong> a atteint <strong>${Math.round(pct)}%</strong> d'utilisation.</p>
                 <p>Budget alloué : <strong>${dept.budgetFormationAnnuel} TND</strong><br>
                 Budget utilisé : <strong>${dept.budgetUtilise} TND</strong><br>
                 Budget restant : <strong>${dept.budgetRestant} TND</strong></p>`, 'Voir le budget', `${process.env.FRONTEND_URL}/rh/budget`),
                        });
                    }
                    alertesEnvoyees++;
                    logger_1.logger.warn(`⚠️ Alerte budget ${seuil}% - Département ${dept.nom}`);
                }
            };
            await sendAlerte(60, 'alerteSent60');
            await sendAlerte(80, 'alerteSent80');
            await sendAlerte(90, 'alerteSent90');
        }
        return { alertesEnvoyees };
    }
    /**
     * Impacter le budget d'un département suite à une inscription
     */
    static async impacterBudget(departementId, montant) {
        const dept = await models_1.Departement.findByPk(departementId);
        if (!dept)
            return;
        await dept.update({
            budgetUtilise: Number(dept.budgetUtilise) + montant,
        });
        // Vérifier alertes
        await this.verifierBudgets();
    }
    // ============================================
    // RAPPELS FORMATIONS (Workflow 7)
    // ============================================
    static async envoyerRappels() {
        const now = new Date();
        const formations = await models_1.Formation.findAll({
            where: { statut: 'Publiee', dateDebut: { [sequelize_1.Op.gte]: now } },
            include: [{ model: models_1.InscriptionFormation, as: 'inscriptions', where: { statut: 'Validee' }, include: [{ model: models_1.Employe, as: 'employe' }] }],
        });
        let count = 0;
        for (const f of formations) {
            if (!f.dateDebut)
                continue;
            const debut = new Date(f.dateDebut);
            const diffJours = Math.ceil((debut.getTime() - now.getTime()) / (1000 * 3600 * 24));
            const inscriptions = f.inscriptions;
            for (const insc of inscriptions) {
                const employe = insc.employe;
                if (!employe)
                    continue;
                if (diffJours === 7 && !insc.rappelJ7Envoye) {
                    await (0, email_1.sendEmail)({
                        to: employe.email,
                        subject: `📅 Rappel J-7 : "${f.titre}" commence dans 7 jours`,
                        html: email_1.emailTemplates.baseTemplate('Rappel Formation J-7', `<p>La formation <strong>${f.titre}</strong> commence le <strong>${debut.toLocaleDateString('fr-FR')}</strong>.</p>`),
                    });
                    await insc.update({ rappelJ7Envoye: true });
                    count++;
                }
                if (diffJours === 2 && !insc.rappelJ2Envoye) {
                    await (0, email_1.sendEmail)({
                        to: employe.email,
                        subject: `📅 Rappel J-2 : "${f.titre}" dans 2 jours`,
                        html: email_1.emailTemplates.baseTemplate('Rappel Formation J-2', `<p>Rappel : <strong>${f.titre}</strong> commence dans 2 jours (${debut.toLocaleDateString('fr-FR')}).</p>
               ${f.lieu ? `<p>Lieu : ${f.lieu}</p>` : ''}
               ${f.lienVisio ? `<p><a href="${f.lienVisio}">Rejoindre en ligne</a></p>` : ''}`),
                    });
                    await insc.update({ rappelJ2Envoye: true });
                    count++;
                }
            }
        }
        // Questionnaire satisfaction J+1 après fin
        const formationsTerminees = await models_1.Formation.findAll({
            where: { statut: 'En_cours', questionnaireSatisfactionEnvoye: false },
            include: [{ model: models_1.InscriptionFormation, as: 'inscriptions', where: { statut: 'Terminee' }, include: [{ model: models_1.Employe, as: 'employe' }] }],
        });
        for (const f of formationsTerminees) {
            if (!f.dateFin)
                continue;
            const fin = new Date(f.dateFin);
            const diffFin = Math.ceil((now.getTime() - fin.getTime()) / (1000 * 3600 * 24));
            if (diffFin >= 1) {
                const inscriptions = f.inscriptions;
                for (const insc of inscriptions) {
                    const employe = insc.employe;
                    if (!employe)
                        continue;
                    await (0, email_1.sendEmail)({
                        to: employe.email,
                        subject: `⭐ Évaluation formation - ${f.titre}`,
                        html: email_1.emailTemplates.baseTemplate('Votre avis nous intéresse !', `<p>Comment s'est passée la formation <strong>${f.titre}</strong> ?</p>`, 'Donner mon avis', `${process.env.FRONTEND_URL}/employe/evaluations/${insc.id}`),
                    });
                    count++;
                }
                await f.update({ questionnaireSatisfactionEnvoye: true });
            }
        }
        logger_1.logger.info(`📅 Rappels formations envoyés : ${count}`);
        return { rappelsEnvoyes: count };
    }
    // ============================================
    // WORKFLOW 8 : Génération certificat
    // ============================================
    static async genererCertificat(inscriptionId) {
        const inscription = await models_1.InscriptionFormation.findByPk(inscriptionId, {
            include: [{ model: models_1.Employe, as: 'employe' }, { model: models_1.Formation, as: 'formation' }],
        });
        if (!inscription)
            throw new error_middleware_1.AppError(404, 'Inscription introuvable.');
        if (!inscription.tauxPresence || inscription.tauxPresence < 80) {
            throw new error_middleware_1.AppError(400, `Taux de présence insuffisant (${inscription.tauxPresence}% < 80%)`);
        }
        const employe = inscription.employe;
        const formation = inscription.formation;
        const certificat = await pdf_service_1.PdfService.genererCertificat(employe, formation, inscription.tauxPresence);
        await inscription.update({
            certificationObtenue: true,
            certificatPath: certificat.path,
            dateEnvoiCertificat: new Date(),
        });
        await (0, email_1.sendEmail)({
            to: employe.email,
            subject: `🏆 Certificat de formation - ${formation.titre}`,
            html: email_1.emailTemplates.baseTemplate('Votre certificat de formation', `<p>Félicitations ! Vous avez complété la formation <strong>${formation.titre}</strong> avec succès.</p>
         <p>Votre certificat est joint à ce message.</p>`),
            attachments: [{ filename: `certificat_${formation.titre}.pdf`, path: certificat.path }],
        });
        return { message: 'Certificat généré et envoyé.', certificatPath: certificat.path };
    }
    // ============================================
    // CRUD FORMATIONS
    // ============================================
    static async getAll(filters = {}, options) {
        const where = {};
        if (filters.statut)
            where.statut = filters.statut;
        if (filters.domaine)
            where.domaine = filters.domaine;
        if (filters.type)
            where.type = filters.type;
        if (filters.search)
            where.titre = { [sequelize_1.Op.like]: `%${filters.search}%` };
        const list = await models_1.Formation.findAll({
            where,
            include: [{ model: models_1.Employe, as: 'formateurInterne', attributes: ['id', 'nom', 'prenom'] }],
            order: [['dateDebut', 'ASC']],
        });
        if (!options?.employeId) {
            return list;
        }
        const inscs = await models_1.InscriptionFormation.findAll({
            where: { employeId: options.employeId },
            attributes: ['id', 'formationId', 'statut'],
        });
        const byFormation = new Map();
        for (const i of inscs) {
            byFormation.set(i.formationId, { id: i.id, statut: i.statut });
        }
        return list.map((row) => {
            const mine = byFormation.get(row.id);
            return {
                ...row.toJSON(),
                monInscription: mine ? { id: mine.id, statut: mine.statut } : null,
            };
        });
    }
    static async getById(id, options) {
        const f = await models_1.Formation.findByPk(id, {
            include: [
                { model: models_1.Employe, as: 'formateurInterne', attributes: ['id', 'nom', 'prenom', 'email'] },
                { model: models_1.InscriptionFormation, as: 'inscriptions', include: [{ model: models_1.Employe, as: 'employe', attributes: ['id', 'nom', 'prenom'] }] },
            ],
        });
        if (!f)
            throw new error_middleware_1.AppError(404, 'Formation introuvable.');
        if (!options?.employeId)
            return f;
        const plain = f.toJSON();
        const mine = await models_1.InscriptionFormation.findOne({
            where: { formationId: id, employeId: options.employeId },
            attributes: ['id', 'statut'],
        });
        return {
            ...plain,
            monInscription: mine ? { id: mine.id, statut: mine.statut } : null,
        };
    }
    static async create(data) {
        return models_1.Formation.create({ ...data, statut: 'Brouillon' });
    }
    static async update(id, data) {
        const f = await models_1.Formation.findByPk(id);
        if (!f)
            throw new error_middleware_1.AppError(404, 'Formation introuvable.');
        await f.update(data);
        return f;
    }
    static async publier(id) {
        const f = await models_1.Formation.findByPk(id);
        if (!f)
            throw new error_middleware_1.AppError(404, 'Formation introuvable.');
        await f.update({ statut: 'Publiee' });
        logger_1.logger.info(`📢 Formation publiée : #${id} - ${f.titre}`);
        return f;
    }
}
exports.FormationService = FormationService;
//# sourceMappingURL=formation.service.js.map