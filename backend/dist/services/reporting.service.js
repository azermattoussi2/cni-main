"use strict";
// ============================================
// Fichier : services/reporting.service.ts
// Description : Service Reporting & Analytics
// KPIs temps réel pour chaque rôle (workflows 16-17)
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingService = void 0;
const database_1 = require("../config/database");
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
class ReportingService {
    static async syncFinishedStagesByDate() {
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        await models_1.Stagiaire.update({ statut: 'Termine' }, {
            where: {
                statut: 'En_cours',
                dateFinStage: { [sequelize_1.Op.lt]: now },
            },
        });
    }
    /** Formations suivies en tant que participant (inscription confirmée ou liste d’attente / terminée). */
    static async formationIdsCalendarParticipant(employeId) {
        const rows = await models_1.InscriptionFormation.findAll({
            where: {
                employeId,
                statut: { [sequelize_1.Op.in]: [...ReportingService.CALENDAR_INSCRIPTION_STATUTS] },
            },
            attributes: ['formationId'],
            raw: true,
        });
        const ids = rows.map((r) => r.formationId);
        return [...new Set(ids)];
    }
    /**
     * @param scope global = vue organisation (toutes formations + stages) ; mine = périmètre personnel selon le rôle
     */
    static async getCalendarEvents(userId, role, scope = 'global') {
        const formationWhere = {};
        const stageWhere = {};
        if (role === 'Stagiaire') {
            stageWhere.id = userId;
            formationWhere.id = { [sequelize_1.Op.in]: [-1] };
        }
        else if (scope === 'mine') {
            if (role === 'Employe') {
                const fids = await ReportingService.formationIdsCalendarParticipant(userId);
                formationWhere.id = { [sequelize_1.Op.in]: fids.length ? fids : [-1] };
                stageWhere.id = { [sequelize_1.Op.in]: [-1] };
            }
            else if (role === 'Formateur_Interne') {
                const fidsParticipant = await ReportingService.formationIdsCalendarParticipant(userId);
                const asTrainer = await models_1.Formation.findAll({
                    where: { formateurId: userId },
                    attributes: ['id'],
                    raw: true,
                });
                const fidsTrainer = asTrainer.map((f) => f.id);
                const merged = [...new Set([...fidsParticipant, ...fidsTrainer])];
                formationWhere.id = { [sequelize_1.Op.in]: merged.length ? merged : [-1] };
                stageWhere.id = { [sequelize_1.Op.in]: [-1] };
            }
            else if (role === 'Formateur_Externe') {
                const fidsParticipant = await ReportingService.formationIdsCalendarParticipant(userId);
                const emp = await models_1.Employe.findByPk(userId);
                const orCond = [];
                if (fidsParticipant.length) {
                    orCond.push({ id: { [sequelize_1.Op.in]: fidsParticipant } });
                }
                if (emp?.nom?.trim()) {
                    orCond.push({ formateurNom: { [sequelize_1.Op.like]: `%${emp.nom.trim()}%` } });
                }
                if (!orCond.length) {
                    formationWhere.id = { [sequelize_1.Op.in]: [-1] };
                }
                else if (orCond.length === 1) {
                    Object.assign(formationWhere, orCond[0]);
                }
                else {
                    formationWhere[sequelize_1.Op.or] = orCond;
                }
                stageWhere.id = { [sequelize_1.Op.in]: [-1] };
            }
            else if (role === 'Manager') {
                const m = await models_1.Employe.findByPk(userId);
                if (m?.departementId) {
                    formationWhere.budgetDepartementId = m.departementId;
                    const stags = await models_1.Stagiaire.findAll({
                        where: { departementId: m.departementId },
                        attributes: ['id'],
                    });
                    const sids = stags.map((s) => s.id);
                    stageWhere.id = { [sequelize_1.Op.in]: sids.length ? sids : [-1] };
                }
                else {
                    formationWhere.id = { [sequelize_1.Op.in]: [-1] };
                    stageWhere.id = { [sequelize_1.Op.in]: [-1] };
                }
            }
            // Direction_RH + mine : pas de filtre (vue = organisation complète)
        }
        // scope === global : pas de filtre (toute l'organisation), sauf Stagiaire déjà traité
        const [formations, stages] = await Promise.all([
            models_1.Formation.findAll({ where: formationWhere, attributes: ['id', 'titre', 'dateDebut', 'dateFin', 'statut', 'lieu'] }),
            models_1.Stagiaire.findAll({ where: stageWhere, attributes: ['id', 'nom', 'prenom', 'dateDebutStage', 'dateFinStage', 'statut'] }),
        ]);
        return [
            ...formations
                .filter((f) => f.dateDebut)
                .map((f) => ({
                id: `formation-${f.id}`,
                title: `Formation: ${f.titre}`,
                start: f.dateDebut,
                end: f.dateFin || f.dateDebut,
                type: 'formation',
                statut: f.statut,
                location: f.lieu,
            })),
            ...stages
                .filter((s) => s.dateDebutStage)
                .map((s) => ({
                id: `stage-${s.id}`,
                title: `Stage: ${s.prenom} ${s.nom}`,
                start: s.dateDebutStage,
                end: s.dateFinStage || s.dateDebutStage,
                type: 'stage',
                statut: s.statut,
            })),
        ];
    }
    /**
     * Dashboard Direction / RH - Vue globale
     */
    static async getDashboardRH() {
        const now = new Date();
        const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
        const debutAnnee = new Date(now.getFullYear(), 0, 1);
        // KPIs Stages
        const [totalCandidatures, stagesEnCours, candidaturesAttente, stagesAcceptes, stagesRefuses, candidaturesMois,] = await Promise.all([
            models_1.Stagiaire.count(),
            models_1.Stagiaire.count({ where: { statut: 'En_cours' } }),
            models_1.Stagiaire.count({ where: { statut: ['En_attente', 'En_examen'] } }),
            models_1.Stagiaire.count({ where: { statut: 'Accepte' } }),
            models_1.Stagiaire.count({ where: { statut: 'Refuse' } }),
            models_1.Stagiaire.count({ where: { createdAt: { [sequelize_1.Op.gte]: debutMois } } }),
        ]);
        // KPIs Formations
        const [totalFormations, formationsMois, totalInscrits, formationsEnCours,] = await Promise.all([
            models_1.Formation.count({ where: { isActif: true } }),
            models_1.Formation.count({ where: { dateDebut: { [sequelize_1.Op.gte]: debutMois } } }),
            models_1.InscriptionFormation.count({ where: { statut: 'Validee' } }),
            models_1.Formation.count({ where: { statut: 'En_cours' } }),
        ]);
        // Budget global
        const departements = await models_1.Departement.findAll({
            where: { isActif: true },
            attributes: ['nom', 'budgetFormationAnnuel', 'budgetUtilise', 'budgetRestant'],
        });
        const budgetTotal = departements.reduce((s, d) => s + Number(d.budgetFormationAnnuel), 0);
        const budgetUtilise = departements.reduce((s, d) => s + Number(d.budgetUtilise), 0);
        // Satisfaction moyenne
        const satisfactionAvg = await models_1.InscriptionFormation.findOne({
            attributes: [[(0, sequelize_1.fn)('AVG', (0, sequelize_1.col)('noteSatisfaction')), 'avg']],
            where: database_1.sequelize.where((0, sequelize_1.col)('noteSatisfaction'), sequelize_1.Op.not, null),
        });
        // Candidatures par mois (12 derniers mois)
        const candidaturesParMois = await models_1.Stagiaire.findAll({
            attributes: [
                [(0, sequelize_1.fn)('MONTH', (0, sequelize_1.col)('createdAt')), 'mois'],
                [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'count'],
            ],
            where: { createdAt: { [sequelize_1.Op.gte]: debutAnnee } },
            group: [(0, sequelize_1.fn)('MONTH', (0, sequelize_1.col)('createdAt'))],
            raw: true,
        });
        // Top 5 formations les plus demandées
        const topFormations = await models_1.InscriptionFormation.findAll({
            attributes: [
                'formationId',
                [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('InscriptionFormation.id')), 'count'],
            ],
            include: [{ model: models_1.Formation, as: 'formation', attributes: ['titre', 'domaine'] }],
            group: ['formationId'],
            order: [[(0, sequelize_1.literal)('count'), 'DESC']],
            limit: 5,
            raw: false,
        });
        // Formateurs internes
        const formateursInternes = await models_1.Employe.count({ where: { estFormateur: true, isActif: true } });
        // Alertes budget
        const alertesBudget = departements.filter(d => {
            const pct = (Number(d.budgetUtilise) / Number(d.budgetFormationAnnuel)) * 100;
            return pct >= 80;
        });
        return {
            stages: {
                total: totalCandidatures,
                enCours: stagesEnCours,
                enAttente: candidaturesAttente,
                acceptes: stagesAcceptes,
                refuses: stagesRefuses,
                duMois: candidaturesMois,
                tauxAcceptation: totalCandidatures > 0 ? Math.round((stagesAcceptes / totalCandidatures) * 100) : 0,
            },
            formations: {
                total: totalFormations,
                duMois: formationsMois,
                totalInscrits,
                enCours: formationsEnCours,
                satisfactionMoyenne: satisfactionAvg?.dataValues?.avg
                    ? parseFloat(satisfactionAvg.dataValues.avg).toFixed(1)
                    : null,
            },
            budget: {
                total: budgetTotal,
                utilise: budgetUtilise,
                restant: budgetTotal - budgetUtilise,
                pourcentage: budgetTotal > 0 ? Math.round((budgetUtilise / budgetTotal) * 100) : 0,
                parDepartement: departements,
                alertes: alertesBudget,
            },
            formateurs: {
                internes: formateursInternes,
            },
            graphiques: {
                candidaturesParMois,
                topFormations,
            },
        };
    }
    /**
     * Dashboard Manager - Vue département
     */
    static async getDashboardManager(managerId) {
        // Trouver le département du manager
        const dept = await models_1.Departement.findOne({ where: { responsableId: managerId } });
        if (!dept) {
            return { message: 'Aucun département assigné', data: null };
        }
        const demandesAttente = await models_1.InscriptionFormation.count({
            where: { managerId, statut: 'En_attente_manager' },
        });
        const employes = await models_1.Employe.findAll({
            where: { departementId: dept.id, isActif: true },
            attributes: ['id', 'nom', 'prenom', 'poste', 'estFormateur'],
        });
        const formationsEquipe = await models_1.InscriptionFormation.findAll({
            include: [
                { model: models_1.Employe, as: 'employe', where: { departementId: dept.id }, attributes: ['id', 'nom', 'prenom'] },
                { model: models_1.Formation, as: 'formation', attributes: ['id', 'titre', 'dateDebut', 'dateFin', 'domaine'] },
            ],
            where: { statut: ['Validee', 'Terminee'] },
            order: [[{ model: models_1.Formation, as: 'formation' }, 'dateDebut', 'ASC']],
        });
        return {
            departement: dept,
            demandesEnAttente: demandesAttente,
            budget: {
                alloue: dept.budgetFormationAnnuel,
                utilise: dept.budgetUtilise,
                restant: dept.budgetRestant,
                pourcentage: Number(dept.budgetFormationAnnuel) > 0
                    ? Math.round((Number(dept.budgetUtilise) / Number(dept.budgetFormationAnnuel)) * 100)
                    : 0,
            },
            equipe: {
                total: employes.length,
                formateurs: employes.filter(e => e.estFormateur).length,
                liste: employes,
            },
            formations: formationsEquipe,
        };
    }
    /**
     * Dashboard Employé - Vue personnelle
     */
    static async getDashboardEmploye(employeId) {
        const employe = await models_1.Employe.findByPk(employeId, {
            attributes: { exclude: ['motDePasse', 'refreshToken'] },
            include: [{ model: models_1.Departement, as: 'departement', attributes: ['id', 'nom'] }],
        });
        if (!employe)
            throw new Error('Employé introuvable');
        const inscriptions = await models_1.InscriptionFormation.findAll({
            where: { employeId },
            include: [{ model: models_1.Formation, as: 'formation', attributes: ['id', 'titre', 'domaine', 'dateDebut', 'dateFin', 'dureeHeures'] }],
            order: [['createdAt', 'DESC']],
        });
        const certifications = inscriptions.filter(i => i.certificationObtenue);
        const formationsAVenir = inscriptions.filter(i => {
            const f = i.formation;
            return f?.dateDebut && new Date(f.dateDebut) > new Date() && i.statut === 'Validee';
        });
        // Catalogue disponible (formations publiées non encore inscrites)
        const formationsInscrites = inscriptions.map(i => i.formationId);
        const catalogue = await models_1.Formation.findAll({
            where: {
                statut: 'Publiee',
                id: { [sequelize_1.Op.notIn]: formationsInscrites.length > 0 ? formationsInscrites : [-1] },
            },
            limit: 10,
            order: [['dateDebut', 'ASC']],
        });
        return {
            profil: employe,
            stats: {
                totalFormations: inscriptions.filter(i => i.statut === 'Terminee').length,
                enCours: inscriptions.filter(i => i.statut === 'Validee').length,
                certificats: certifications.length,
                heuresFormation: inscriptions
                    .filter(i => i.statut === 'Terminee')
                    .reduce((sum, i) => sum + (i.formation?.dureeHeures || 0), 0),
            },
            formationsAVenir,
            certifications,
            catalogue,
            estFormateur: employe.estFormateur,
            badges: employe.badges ? JSON.parse(employe.badges) : [],
        };
    }
    /**
     * Dashboard Tuteur de stage
     */
    static async getDashboardTuteur(tuteurId) {
        await ReportingService.syncFinishedStagesByDate();
        const stagiaires = await models_1.Stagiaire.findAll({
            where: {
                tuteurId,
                statut: ['En_cours', 'Accepte', 'Termine'],
                [sequelize_1.Op.and]: [database_1.sequelize.where((0, sequelize_1.col)('projetPdfPath'), sequelize_1.Op.ne, null)],
            },
            include: [{ model: models_1.Departement, as: 'departement', attributes: ['id', 'nom'] }],
        });
        return {
            stagiairesSuivis: stagiaires,
            total: stagiaires.length,
            evaluationsEnAttente: stagiaires.filter(s => s.statut === 'En_cours' && !s.noteIntermediaire).length,
        };
    }
    /**
     * Rapport hebdomadaire (Workflow 16)
     */
    static async genererRapportHebdomadaire() {
        const debutSemaine = new Date();
        debutSemaine.setDate(debutSemaine.getDate() - 7);
        const [nouvelles, acceptees, formationsAjoutees, inscriptions] = await Promise.all([
            models_1.Stagiaire.count({ where: { createdAt: { [sequelize_1.Op.gte]: debutSemaine } } }),
            models_1.Stagiaire.count({ where: { statut: 'Accepte', updatedAt: { [sequelize_1.Op.gte]: debutSemaine } } }),
            models_1.Formation.count({ where: { createdAt: { [sequelize_1.Op.gte]: debutSemaine } } }),
            models_1.InscriptionFormation.count({ where: { createdAt: { [sequelize_1.Op.gte]: debutSemaine } } }),
        ]);
        return {
            periode: `${debutSemaine.toLocaleDateString('fr-FR')} - ${new Date().toLocaleDateString('fr-FR')}`,
            stages: { nouvelles, acceptees },
            formations: { nouvelles: formationsAjoutees, inscriptions },
        };
    }
}
exports.ReportingService = ReportingService;
/** Inscriptions prises en compte dans « Mon calendrier » (demande acceptée côté métier). */
ReportingService.CALENDAR_INSCRIPTION_STATUTS = ['Validee', 'Liste_attente', 'Terminee'];
//# sourceMappingURL=reporting.service.js.map