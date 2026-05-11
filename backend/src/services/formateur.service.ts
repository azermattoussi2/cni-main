// ============================================
// Fichier : services/formateur.service.ts
// Description : Service métier - Module Formateurs
// Workflows 9-14 : notification opportunité, matching, réponse, profil, gamification
// ============================================

import { Employe, Formation, DemandeFormateur, Departement } from '../models';
import { sendEmail, emailTemplates } from '../config/email';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../config/logger';
import { Op } from 'sequelize';
import { logWorkflowEvent } from '../utils/workflow-audit';

export class FormateurService {

  // ============================================
  // WORKFLOW 9 : Notification opportunité formateur
  // ============================================

  /**
   * Notifier les formateurs internes qualifiés d'une opportunité
   * Algorithme de matching : compare domaines formation ↔ compétences formateur
   */
  static async notifierOpportunite(formationId: number) {
    const formation = await Formation.findByPk(formationId);
    if (!formation) throw new AppError(404, 'Formation introuvable.');

    // Trouver les formateurs internes disponibles avec les compétences requises
    const formateurs = await Employe.findAll({
      where: { estFormateur: true, isActif: true },
    });

    const qualifies: Array<{ formateur: Employe; score: number }> = [];

    for (const f of formateurs) {
      const score = this.calculerScoreMatching(f, formation);
      if (score > 0) qualifies.push({ formateur: f, score });
    }

    // Trier par score décroissant
    qualifies.sort((a, b) => b.score - a.score);

    // Envoyer les notifications avec date limite 3 jours
    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() + 3);

    let notifEnvoyees = 0;
    for (const { formateur, score } of qualifies.slice(0, 5)) { // max 5 formateurs notifiés
      const demande = await DemandeFormateur.create({
        formateurId: formateur.id,
        formationId,
        dateLimiteReponse: dateLimite,
        messagePersonnalise: `Score de compatibilité : ${score}/10`,
      });

      await sendEmail({
        to: formateur.email,
        subject: `🎯 Opportunité de formation - ${formation.titre}`,
        html: emailTemplates.baseTemplate(
          'Nouvelle opportunité de formation',
          `<p>Bonjour <strong>${formateur.prenom} ${formateur.nom}</strong>,</p>
           <p>Votre profil correspond à la formation <strong>${formation.titre}</strong>.</p>
           <p><strong>Domaine :</strong> ${formation.domaine}<br>
           <strong>Durée :</strong> ${formation.dureeJours || '?'} jour(s)<br>
           <strong>Date limite de réponse :</strong> ${dateLimite.toLocaleDateString('fr-FR')}</p>`,
          'Voir l\'opportunité',
          `${process.env.FRONTEND_URL}/formateur/opportunites/${demande.id}`
        ),
      });

      notifEnvoyees++;
      logger.info(`📧 Opportunité notifiée : formateur #${formateur.id} → formation #${formationId} (score: ${score})`);
      logWorkflowEvent({
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
  static calculerScoreMatching(formateur: Employe, formation: Formation): number {
    let score = 0;

    // Compétences correspondantes
    if (formateur.domainesCompetences) {
      const competences: string[] = JSON.parse(formateur.domainesCompetences);
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
  static async repondreOpportunite(
    demandeId: number,
    formateurId: number,
    action: 'accepter' | 'refuser',
    commentaire?: string
  ) {
    const demande = await DemandeFormateur.findByPk(demandeId, {
      include: [{ model: Formation, as: 'formation' }],
    });
    if (!demande) throw new AppError(404, 'Demande introuvable.');
    if (demande.formateurId !== formateurId) throw new AppError(403, 'Accès refusé.');
    if (demande.statut !== 'En_attente') throw new AppError(400, 'Cette demande a déjà été traitée.');
    const formateur = await Employe.findByPk(formateurId);
    if (!formateur || !formateur.estFormateur) {
      throw new AppError(403, 'Seul un formateur interne peut répondre à cette opportunité.');
    }

    const maintenant = new Date();
    if (maintenant > new Date(demande.dateLimiteReponse)) {
      await demande.update({ statut: 'Expiree' });
      throw new AppError(400, 'Date limite de réponse dépassée.');
    }

    const formation = (demande as any).formation as Formation;

    if (action === 'refuser') {
      await demande.update({ statut: 'Refusee', dateReponse: maintenant, commentaireRefus: commentaire });

      // Notifier RH du refus
      const rhUsers = await Employe.findAll({ where: { role: 'Direction_RH', isActif: true } });
      for (const rh of rhUsers) {
        await sendEmail({
          to: rh.email,
          subject: `ℹ️ Refus formateur - ${formation.titre}`,
          html: emailTemplates.baseTemplate(
            'Formateur a refusé',
            `<p>Un formateur a refusé l'opportunité pour <strong>${formation.titre}</strong>. Vous pouvez lancer une nouvelle recherche.</p>`,
            'Trouver un formateur',
            `${process.env.FRONTEND_URL}/rh/formateurs/matching/${formation.id}`
          ),
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
    const rhUsers = await Employe.findAll({ where: { role: 'Direction_RH', isActif: true } });
    for (const rh of rhUsers) {
      await sendEmail({
        to: rh.email,
        subject: `✅ Formateur confirmé - ${formation.titre}`,
        html: emailTemplates.baseTemplate(
          'Formateur confirmé',
          `<p>Un formateur interne a accepté d'animer la formation <strong>${formation.titre}</strong>.</p>`
        ),
      });
    }

    logger.info(`✅ Formateur #${formateurId} accepté pour formation #${formation.id}`);
    logWorkflowEvent({
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
  static async attribuerBadges(formateurId: number) {
    const formateur = await Employe.findByPk(formateurId);
    if (!formateur || !formateur.estFormateur) return;

    const badges: string[] = formateur.badges ? JSON.parse(formateur.badges) : [];
    const totalHeures = formateur.totalHeuresFormation || 0;
    const note = formateur.noteFormateur || 0;

    const badgesAttribues: string[] = [];

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

      await sendEmail({
        to: formateur.email,
        subject: `🏅 Nouveau badge obtenu ! - CNI`,
        html: emailTemplates.baseTemplate(
          'Félicitations ! Nouveau badge obtenu',
          `<p>Vous avez obtenu ${badgesAttribues.length > 1 ? 'de nouveaux badges' : 'un nouveau badge'} :<br>
           <strong>${badgesAttribues.join(', ')}</strong></p>`,
        ),
      });

      logger.info(`🏅 Badges attribués à ${formateur.nom} : ${badgesAttribues.join(', ')}`);
    }

    return { badges, nouveauxBadges: badgesAttribues };
  }

  /**
   * Calculer la compensation pour un formateur
   */
  static async calculerCompensation(formateurId: number, formation: Formation) {
    const heures = (formation.dureeHeures || (formation.dureeJours || 1) * 8);
    const prime = heures * 50; // 50 TND/heure (configurable)
    return { prime, heures };
  }

  // ============================================
  // WORKFLOW 11 : Mise à jour profil formateur
  // ============================================

  static async inscrireCommeFormateur(employeId: number, data: {
    domainesCompetences: string[];
    disponibiliteHeures: number;
    motivation?: string;
  }) {
    const employe = await Employe.findByPk(employeId);
    if (!employe) throw new AppError(404, 'Employé introuvable.');

    await employe.update({
      estFormateur: true,
      domainesCompetences: JSON.stringify(data.domainesCompetences),
      disponibiliteHeures: data.disponibiliteHeures,
    });

    // Notifier RH
    const rhUsers = await Employe.findAll({ where: { role: 'Direction_RH', isActif: true } });
    for (const rh of rhUsers) {
      await sendEmail({
        to: rh.email,
        subject: `🎓 Nouvel inscription formateur interne - ${employe.prenom} ${employe.nom}`,
        html: emailTemplates.baseTemplate(
          'Nouveau formateur interne',
          `<p><strong>${employe.prenom} ${employe.nom}</strong> s'est inscrit comme formateur interne.</p>
           <p><strong>Compétences :</strong> ${data.domainesCompetences.join(', ')}</p>
           <p><strong>Disponibilité :</strong> ${data.disponibiliteHeures}h/mois</p>`
        ),
      });
    }

    logger.info(`🎓 Nouveau formateur interne : ${employe.nom} #${employeId}`);
    return employe;
  }

  static async getFormateursInternes(
    filtres: Record<string, unknown> = {},
    user?: { role: string; departementId?: number | null }
  ) {
    const where: any = { estFormateur: true };
    const gestion =
      filtres.listMode === 'gestion' && user && ['Direction_RH', 'Manager'].includes(user.role);

    if (!gestion) {
      where.isActif = true;
      where.isArchived = false;
      if (filtres.domaine) {
        where.domainesCompetences = { [Op.like]: `%${filtres.domaine}%` };
      }
    } else {
      if (user!.role === 'Manager' && user.departementId) {
        where.departementId = user.departementId;
      }
      const f = filtres as Record<string, string | undefined>;
      if (f.isActif === 'true') where.isActif = true;
      else if (f.isActif === 'false') where.isActif = false;
      if (f.isArchived === 'true') where.isArchived = true;
      else if (f.isArchived === 'false') where.isArchived = false;
      else if (f.includeArchived !== '1') where.isArchived = false;
      if (f.search?.trim()) {
        const term = `%${f.search.trim()}%`;
        where[Op.or] = [
          { nom: { [Op.like]: term } },
          { prenom: { [Op.like]: term } },
          { email: { [Op.like]: term } },
        ];
      }
      if (filtres.domaine) {
        where.domainesCompetences = { [Op.like]: `%${filtres.domaine}%` };
      }
    }

    return Employe.findAll({
      where,
      attributes: { exclude: ['motDePasse', 'refreshToken'] },
      include: [{ model: Departement, as: 'departement', attributes: ['id', 'nom', 'code'] }],
      order: [['nom', 'ASC']],
    });
  }

  static async getFormateurInterneById(id: number) {
    const e = await Employe.findOne({
      where: { id, estFormateur: true },
      attributes: { exclude: ['motDePasse', 'refreshToken'] },
      include: [{ model: Departement, as: 'departement', attributes: ['id', 'nom'] }],
    });
    if (!e) throw new AppError(404, 'Formateur introuvable.');
    return e;
  }

  static async createFormateurInterne(data: {
    nom: string;
    prenom: string;
    email: string;
    motDePasse: string;
    departementId?: number;
    poste?: string;
    telephone?: string;
    domainesCompetences: string[];
    disponibiliteHeures: number;
  }) {
    const exists = await Employe.findOne({ where: { email: data.email } });
    if (exists) throw new AppError(400, 'Un compte existe déjà avec cet email.');

    const created = await Employe.create({
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
    } as any);

    const full = await Employe.findByPk(created.id, {
      attributes: { exclude: ['motDePasse', 'refreshToken'] },
      include: [{ model: Departement, as: 'departement', attributes: ['id', 'nom'] }],
    });
    if (!full) throw new AppError(500, 'Erreur lors de la création du formateur.');
    logger.info(`🎓 Formateur interne créé (admin) : ${full.prenom} ${full.nom} #${full.id}`);
    return full;
  }

  static async updateFormateurInterne(
    id: number,
    data: {
      nom?: string;
      prenom?: string;
      email?: string;
      motDePasse?: string;
      departementId?: number | null;
      poste?: string;
      telephone?: string;
      domainesCompetences?: string[];
      disponibiliteHeures?: number;
      isActif?: boolean;
      isArchived?: boolean;
    }
  ) {
    const e = await Employe.findOne({ where: { id, estFormateur: true } });
    if (!e) throw new AppError(404, 'Formateur introuvable.');

    if (data.email && data.email !== e.email) {
      const exists = await Employe.findOne({ where: { email: data.email } });
      if (exists) throw new AppError(400, 'Email déjà utilisé.');
    }

    const updatePayload: Record<string, unknown> = {};
    if (data.nom !== undefined) updatePayload.nom = data.nom;
    if (data.prenom !== undefined) updatePayload.prenom = data.prenom;
    if (data.email !== undefined) updatePayload.email = data.email;
    if (data.poste !== undefined) updatePayload.poste = data.poste;
    if (data.telephone !== undefined) updatePayload.telephone = data.telephone;
    if (data.departementId !== undefined) updatePayload.departementId = data.departementId;
    if (data.disponibiliteHeures !== undefined) updatePayload.disponibiliteHeures = data.disponibiliteHeures;
    if (data.isActif !== undefined) updatePayload.isActif = data.isActif;
    if (data.isArchived !== undefined) {
      updatePayload.isArchived = data.isArchived;
      if (data.isArchived === true) updatePayload.isActif = false;
    }
    if (data.domainesCompetences !== undefined) {
      updatePayload.domainesCompetences = JSON.stringify(data.domainesCompetences);
    }
    if (data.motDePasse) updatePayload.motDePasse = data.motDePasse;

    await e.update(updatePayload);

    const updated = await Employe.findByPk(id, {
      attributes: { exclude: ['motDePasse', 'refreshToken'] },
      include: [{ model: Departement, as: 'departement', attributes: ['id', 'nom'] }],
    });
    if (!updated) throw new AppError(500, 'Erreur lors de la mise à jour.');
    logger.info(`🎓 Formateur interne mis à jour (admin) : #${id}`);
    return updated;
  }

  static async getDashboardFormateur(formateurId: number) {
    const formateur = await Employe.findByPk(formateurId, {
      attributes: { exclude: ['motDePasse', 'refreshToken'] },
    });
    if (!formateur) throw new AppError(404, 'Formateur introuvable.');

    const demandes = await DemandeFormateur.findAll({
      where: { formateurId },
      include: [{ model: Formation, as: 'formation' }],
      order: [['createdAt', 'DESC']],
    });

    const statsFormations = await Formation.findAll({
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
