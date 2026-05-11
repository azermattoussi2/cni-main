// ============================================
// Fichier : services/reporting.service.ts
// Description : Service Reporting & Analytics
// KPIs temps réel pour chaque rôle (workflows 16-17)
// ============================================

import { sequelize } from '../config/database';
import { Stagiaire, Formation, Employe, InscriptionFormation, Departement, BudgetTracker } from '../models';
import { Op, fn, col, literal } from 'sequelize';

export class ReportingService {
  private static async syncFinishedStagesByDate() {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    await Stagiaire.update(
      { statut: 'Termine' },
      {
        where: {
          statut: 'En_cours',
          dateFinStage: { [Op.lt]: now },
        },
      }
    );
  }
  /** Inscriptions prises en compte dans « Mon calendrier » (demande acceptée côté métier). */
  private static readonly CALENDAR_INSCRIPTION_STATUTS = ['Validee', 'Liste_attente', 'Terminee'] as const;

  /** Formations suivies en tant que participant (inscription confirmée ou liste d’attente / terminée). */
  private static async formationIdsCalendarParticipant(employeId: number): Promise<number[]> {
    const rows = await InscriptionFormation.findAll({
      where: {
        employeId,
        statut: { [Op.in]: [...ReportingService.CALENDAR_INSCRIPTION_STATUTS] },
      },
      attributes: ['formationId'],
      raw: true,
    });
    const ids = (rows as { formationId: number }[]).map((r) => r.formationId);
    return [...new Set(ids)];
  }

  /**
   * @param scope global = vue organisation (toutes formations + stages) ; mine = périmètre personnel selon le rôle
   */
  static async getCalendarEvents(userId: number, role: string, scope: 'global' | 'mine' = 'global') {
    const formationWhere: any = {};
    const stageWhere: any = {};

    if (role === 'Stagiaire') {
      stageWhere.id = userId;
      formationWhere.id = { [Op.in]: [-1] };
    } else if (scope === 'mine') {
      if (role === 'Employe') {
        const fids = await ReportingService.formationIdsCalendarParticipant(userId);
        formationWhere.id = { [Op.in]: fids.length ? fids : [-1] };
        stageWhere.id = { [Op.in]: [-1] };
      } else if (role === 'Formateur_Interne') {
        const fidsParticipant = await ReportingService.formationIdsCalendarParticipant(userId);
        const asTrainer = await Formation.findAll({
          where: { formateurId: userId },
          attributes: ['id'],
          raw: true,
        });
        const fidsTrainer = (asTrainer as { id: number }[]).map((f) => f.id);
        const merged = [...new Set([...fidsParticipant, ...fidsTrainer])];
        formationWhere.id = { [Op.in]: merged.length ? merged : [-1] };
        stageWhere.id = { [Op.in]: [-1] };
      } else if (role === 'Formateur_Externe') {
        const fidsParticipant = await ReportingService.formationIdsCalendarParticipant(userId);
        const emp = await Employe.findByPk(userId);
        const orCond: object[] = [];
        if (fidsParticipant.length) {
          orCond.push({ id: { [Op.in]: fidsParticipant } });
        }
        if (emp?.nom?.trim()) {
          orCond.push({ formateurNom: { [Op.like]: `%${emp.nom.trim()}%` } });
        }
        if (!orCond.length) {
          formationWhere.id = { [Op.in]: [-1] };
        } else if (orCond.length === 1) {
          Object.assign(formationWhere, orCond[0]);
        } else {
          formationWhere[Op.or] = orCond;
        }
        stageWhere.id = { [Op.in]: [-1] };
      } else if (role === 'Manager') {
        const m = await Employe.findByPk(userId);
        if (m?.departementId) {
          formationWhere.budgetDepartementId = m.departementId;
          const stags = await Stagiaire.findAll({
            where: { departementId: m.departementId },
            attributes: ['id'],
          });
          const sids = stags.map((s) => s.id);
          stageWhere.id = { [Op.in]: sids.length ? sids : [-1] };
        } else {
          formationWhere.id = { [Op.in]: [-1] };
          stageWhere.id = { [Op.in]: [-1] };
        }
      }
      // Direction_RH + mine : pas de filtre (vue = organisation complète)
    }
    // scope === global : pas de filtre (toute l'organisation), sauf Stagiaire déjà traité

    const [formations, stages] = await Promise.all([
      Formation.findAll({ where: formationWhere, attributes: ['id', 'titre', 'dateDebut', 'dateFin', 'statut', 'lieu'] }),
      Stagiaire.findAll({ where: stageWhere, attributes: ['id', 'nom', 'prenom', 'dateDebutStage', 'dateFinStage', 'statut'] }),
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
    const [
      totalCandidatures,
      stagesEnCours,
      candidaturesAttente,
      stagesAcceptes,
      stagesRefuses,
      candidaturesMois,
    ] = await Promise.all([
      Stagiaire.count(),
      Stagiaire.count({ where: { statut: 'En_cours' } }),
      Stagiaire.count({ where: { statut: ['En_attente', 'En_examen'] } }),
      Stagiaire.count({ where: { statut: 'Accepte' } }),
      Stagiaire.count({ where: { statut: 'Refuse' } }),
      Stagiaire.count({ where: { createdAt: { [Op.gte]: debutMois } } }),
    ]);

    // KPIs Formations
    const [
      totalFormations,
      formationsMois,
      totalInscrits,
      formationsEnCours,
    ] = await Promise.all([
      Formation.count({ where: { isActif: true } }),
      Formation.count({ where: { dateDebut: { [Op.gte]: debutMois } } }),
      InscriptionFormation.count({ where: { statut: 'Validee' } }),
      Formation.count({ where: { statut: 'En_cours' } }),
    ]);

    // Budget global
    const departements = await Departement.findAll({
      where: { isActif: true },
      attributes: ['nom', 'budgetFormationAnnuel', 'budgetUtilise', 'budgetRestant'],
    });
    const budgetTotal = departements.reduce((s, d) => s + Number(d.budgetFormationAnnuel), 0);
    const budgetUtilise = departements.reduce((s, d) => s + Number(d.budgetUtilise), 0);

    // Satisfaction moyenne
    const satisfactionAvg = await InscriptionFormation.findOne({
      attributes: [[fn('AVG', col('noteSatisfaction')), 'avg']],
      where: sequelize.where(col('noteSatisfaction'), Op.not, null),
    });

    // Candidatures par mois (12 derniers mois)
    const candidaturesParMois = await Stagiaire.findAll({
      attributes: [
        [fn('MONTH', col('createdAt')), 'mois'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: { createdAt: { [Op.gte]: debutAnnee } },
      group: [fn('MONTH', col('createdAt'))],
      raw: true,
    });

    // Top 5 formations les plus demandées
    const topFormations = await InscriptionFormation.findAll({
      attributes: [
        'formationId',
        [fn('COUNT', col('InscriptionFormation.id')), 'count'],
      ],
      include: [{ model: Formation, as: 'formation', attributes: ['titre', 'domaine'] }],
      group: ['formationId'],
      order: [[literal('count'), 'DESC']],
      limit: 5,
      raw: false,
    });

    // Formateurs internes
    const formateursInternes = await Employe.count({ where: { estFormateur: true, isActif: true } });

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
        satisfactionMoyenne: (satisfactionAvg as any)?.dataValues?.avg
          ? parseFloat((satisfactionAvg as any).dataValues.avg).toFixed(1)
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
  static async getDashboardManager(managerId: number) {
    // Trouver le département du manager
    const dept = await Departement.findOne({ where: { responsableId: managerId } });
    if (!dept) {
      return { message: 'Aucun département assigné', data: null };
    }

    const demandesAttente = await InscriptionFormation.count({
      where: { managerId, statut: 'En_attente_manager' },
    });

    const employes = await Employe.findAll({
      where: { departementId: dept.id, isActif: true },
      attributes: ['id', 'nom', 'prenom', 'poste', 'estFormateur'],
    });

    const formationsEquipe = await InscriptionFormation.findAll({
      include: [
        { model: Employe, as: 'employe', where: { departementId: dept.id }, attributes: ['id', 'nom', 'prenom'] },
        { model: Formation, as: 'formation', attributes: ['id', 'titre', 'dateDebut', 'dateFin', 'domaine'] },
      ],
      where: { statut: ['Validee', 'Terminee'] },
      order: [[{ model: Formation, as: 'formation' }, 'dateDebut', 'ASC']],
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
  static async getDashboardEmploye(employeId: number) {
    const employe = await Employe.findByPk(employeId, {
      attributes: { exclude: ['motDePasse', 'refreshToken'] },
      include: [{ model: Departement, as: 'departement', attributes: ['id', 'nom'] }],
    });
    if (!employe) throw new Error('Employé introuvable');

    const inscriptions = await InscriptionFormation.findAll({
      where: { employeId },
      include: [{ model: Formation, as: 'formation', attributes: ['id', 'titre', 'domaine', 'dateDebut', 'dateFin', 'dureeHeures'] }],
      order: [['createdAt', 'DESC']],
    });

    const certifications = inscriptions.filter(i => i.certificationObtenue);
    const formationsAVenir = inscriptions.filter(i => {
      const f = (i as any).formation as Formation;
      return f?.dateDebut && new Date(f.dateDebut) > new Date() && i.statut === 'Validee';
    });

    // Catalogue disponible (formations publiées non encore inscrites)
    const formationsInscrites = inscriptions.map(i => i.formationId);
    const catalogue = await Formation.findAll({
      where: {
        statut: 'Publiee',
        id: { [Op.notIn]: formationsInscrites.length > 0 ? formationsInscrites : [-1] },
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
          .reduce((sum, i) => sum + ((i as any).formation?.dureeHeures || 0), 0),
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
  static async getDashboardTuteur(tuteurId: number) {
    await ReportingService.syncFinishedStagesByDate();
    const stagiaires = await Stagiaire.findAll({
      where: {
        tuteurId,
        statut: ['En_cours', 'Accepte', 'Termine'],
        [Op.and]: [sequelize.where(col('projetPdfPath'), Op.ne, null)],
      },
      include: [{ model: Departement, as: 'departement', attributes: ['id', 'nom'] }],
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
      Stagiaire.count({ where: { createdAt: { [Op.gte]: debutSemaine } } }),
      Stagiaire.count({ where: { statut: 'Accepte', updatedAt: { [Op.gte]: debutSemaine } } }),
      Formation.count({ where: { createdAt: { [Op.gte]: debutSemaine } } }),
      InscriptionFormation.count({ where: { createdAt: { [Op.gte]: debutSemaine } } }),
    ]);

    return {
      periode: `${debutSemaine.toLocaleDateString('fr-FR')} - ${new Date().toLocaleDateString('fr-FR')}`,
      stages: { nouvelles, acceptees },
      formations: { nouvelles: formationsAjoutees, inscriptions },
    };
  }
}
