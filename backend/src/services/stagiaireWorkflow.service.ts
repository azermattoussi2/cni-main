import { Stagiaire, Employe, Departement, Formation } from '../models';
import { JwtPayload } from '../config/jwt';
import { AppError } from '../middlewares/error.middleware';
import { StagiaireService } from './stagiaire.service';
import { PdfService } from './pdf.service';
import { sendEmail, emailTemplates } from '../config/email';
import { logger } from '../config/logger';
import { logWorkflowEvent } from '../utils/workflow-audit';
import { assertCanAutomateStagiaire, assertProjectableStatut, isRh, isManager } from './stagiaireAccess.service';
import { CvAnalysisService } from './cvAnalysis.service';

async function loadStag(id: number) {
  const s = await Stagiaire.findByPk(id, {
    include: [
      { model: Departement, as: 'departement' },
      { model: Employe, as: 'tuteur', attributes: ['id', 'nom', 'prenom', 'email', 'telephone'] },
    ],
  });
  if (!s) throw new AppError(404, 'Stagiaire introuvable.');
  return s;
}

const appBase = () => (process.env.FRONTEND_URL || '').replace(/\/$/, '');

function escapeHtml(t: string) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export class StagiaireWorkflowService {
  static async reanalyzeCv(user: JwtPayload, id: number) {
    const s = await loadStag(id);
    await assertCanAutomateStagiaire(user, s);
    if (!s.cvPath) {
      throw new AppError(400, 'Aucun CV disponible pour relancer l’analyse IA.');
    }
    await s.update({ aiStatus: 'pending', aiError: '' });
    try {
      const analysis = await CvAnalysisService.analyzeCv(s.cvPath);
      await s.update({
        cvExtractedData: JSON.stringify(analysis.extractedData),
        cvExtractedHtml: analysis.extractedHtml,
        aiScore: analysis.ai.score,
        aiMoyenne: analysis.ai.moyenne,
        aiFeedback: analysis.ai.feedback,
        aiStrengths: analysis.ai.strengths.join('\n'),
        aiWeaknesses: analysis.ai.weaknesses.join('\n'),
        aiRecommendation: analysis.ai.recommendation,
        aiStatus: 'done',
        aiError: '',
        aiAnalyzedAt: new Date(),
        cvNomExtrait: analysis.extractedData.name || s.cvNomExtrait,
      });
      logWorkflowEvent({
        workflow: 'stage-automation',
        entity: 'stagiaire',
        entityId: id,
        action: 'reanalyze_cv_ai',
        actorId: user.id,
      });
      const fresh = await loadStag(id);
      return { message: 'Analyse IA relancée avec succès.', stagiaire: fresh };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analyse CV impossible';
      await s.update({ aiStatus: 'failed', aiError: msg.slice(0, 1000), aiAnalyzedAt: new Date() });
      throw new AppError(500, `Relance analyse IA échouée: ${msg}`);
    }
  }

  private static async resolveEncadreur(stagiaire: InstanceType<typeof Stagiaire>, requestedId?: number) {
    if (requestedId) {
      const chosen = await Employe.findByPk(requestedId);
      if (!chosen || !chosen.isActif) throw new AppError(404, 'Encadreur introuvable ou inactif.');
      return chosen;
    }
    if (!stagiaire.departementId) return null;
    // Employé et formateur interne sont considérés comme encadreurs valides.
    const auto = await Employe.findOne({
      where: {
        isActif: true,
        departementId: stagiaire.departementId,
      },
      order: [['estFormateur', 'DESC'], ['updatedAt', 'DESC']],
    });
    return auto;
  }

  /** RH : En_attente → En_examen. Manager : En_examen → Accepte (+ convention). */
  static async accept(user: JwtPayload, id: number, body: {
    commentaire?: string;
    tuteurId?: number;
    dateDebut?: string;
    dateFin?: string;
    sujet?: string;
  }) {
    const s = await loadStag(id);
    await assertCanAutomateStagiaire(user, s);

    if (isRh(user) && s.statut === 'En_attente') {
      return StagiaireService.validerRH(id, 'accepter', body.commentaire);
    }
    if (isManager(user) && s.statut === 'En_examen') {
      return StagiaireService.validerManager(id, user.id, 'accepter', {
        tuteurId: body.tuteurId,
        dateDebut: body.dateDebut,
        dateFin: body.dateFin,
        sujet: body.sujet,
        commentaire: body.commentaire,
      });
    }
    throw new AppError(
      400,
      'Aucune acceptation automatique pour ce statut. RH : candidature en attente. Manager : en examen manager.'
    );
  }

  static async assignProject(
    user: JwtPayload,
    id: number,
    body: { titre?: string; description?: string; departementId?: number; formateurId?: number; formationId?: number }
  ) {
    const s = await loadStag(id);
    if (!isRh(user)) {
      throw new AppError(403, 'Seule la Direction RH peut assigner un projet stagiaire.');
    }
    await assertCanAutomateStagiaire(user, s);
    assertProjectableStatut(s);

    let titre = body.titre?.trim() || '';
    let desc = body.description?.trim();
    let formationSourceId: number | null = null;
    if (body.formationId) {
      const formation = await Formation.findByPk(body.formationId);
      if (!formation || !formation.isActif) throw new AppError(404, 'Formation introuvable.');
      titre = formation.titre;
      desc = desc || formation.description || formation.programme || undefined;
      formationSourceId = formation.id;
      if (!body.formateurId && formation.formateurId) {
        body.formateurId = formation.formateurId;
      }
    }
    if (!titre) throw new AppError(400, 'Titre projet requis (ou choisir une formation).');

    if (isRh(user) && body.departementId) {
      const d = await Departement.findByPk(body.departementId);
      if (!d) throw new AppError(404, 'Département introuvable.');
      await s.update({ departementId: body.departementId });
    }

    const encadreur = await StagiaireWorkflowService.resolveEncadreur(s, body.formateurId);
    await s.update({ sujetStage: titre, ...(encadreur ? { tuteurId: encadreur.id } : {}) });
    await s.reload();

    const pdf = await PdfService.genererFicheProjet(s, titre, desc);
    await s.update({ projetPdfPath: pdf.path });

    await sendEmail({
      to: s.email,
      subject: '📌 Votre projet de stage — CNI',
      html: emailTemplates.baseTemplate(
        'Fiche projet de stage',
        `<p>Bonjour <strong>${s.prenom}</strong>,</p>
         <p>Votre projet de stage a été défini : <strong>${titre}</strong>.</p>
         ${desc ? `<p>${escapeHtml(desc)}</p>` : ''}
         ${encadreur ? `<p><strong>Encadreur :</strong> ${encadreur.prenom} ${encadreur.nom} (${encadreur.email})</p>` : '<p><strong>Encadreur :</strong> sera communiqué prochainement.</p>'}
         <p>La fiche PDF officielle est jointe à ce message.</p>`
      ),
      attachments: [{ filename: 'fiche_projet_stage.pdf', path: pdf.path }],
    });

    if (encadreur) {
      await sendEmail({
        to: encadreur.email,
        subject: `👨‍🏫 Encadrement projet stagiaire — ${s.prenom} ${s.nom}`,
        html: emailTemplates.baseTemplate(
          'Nouveau projet stagiaire',
          `<p>Bonjour <strong>${encadreur.prenom}</strong>,</p>
           <p>Vous êtes assigné comme encadreur pour <strong>${s.prenom} ${s.nom}</strong>.</p>
           <p><strong>Projet :</strong> ${escapeHtml(titre)}</p>
           ${desc ? `<p><strong>Description :</strong> ${escapeHtml(desc)}</p>` : ''}`
        ),
      });
    }

    logWorkflowEvent({
      workflow: 'stage-automation',
      entity: 'stagiaire',
      entityId: id,
      action: 'assign_project',
      actorId: user.id,
      metadata: { titre, encadreurId: encadreur?.id || null, formationSourceId },
    });
    logger.info(`📌 Projet assigné stagiaire #${id}`);
    const fresh = await loadStag(id);
    return {
      message: encadreur
        ? 'Projet + encadreur assignés ensemble, PDF généré et e-mails envoyés.'
        : 'Projet assigné et PDF envoyé. Aucun encadreur disponible automatiquement.',
      stagiaire: fresh,
    };
  }

  static async assignFormateur(user: JwtPayload, id: number, body: { formateurId: number }) {
    const s = await loadStag(id);
    if (!isRh(user) && !isManager(user)) {
      throw new AppError(403, 'Seuls la RH et le manager peuvent assigner le formateur référent.');
    }
    await assertCanAutomateStagiaire(user, s);
    if (!['Accepte', 'En_cours'].includes(s.statut)) {
      throw new AppError(400, 'Assignation impossible : dossier non accepté.');
    }

    const f = await Employe.findByPk(body.formateurId);
    if (!f || !f.isActif) throw new AppError(404, 'Formateur introuvable ou inactif.');

    if (isManager(user) && Number(f.departementId) !== Number(s.departementId)) {
      throw new AppError(400, 'Le formateur doit appartenir au même département que le stagiaire.');
    }

    await s.update({ tuteurId: f.id });

    await sendEmail({
      to: f.email,
      subject: `👨‍🏫 Vous êtes référent stage — ${s.prenom} ${s.nom}`,
      html: emailTemplates.baseTemplate(
        'Nouveau stagiaire sous votre encadrement',
        `<p>Bonjour <strong>${f.prenom}</strong>,</p>
         <p>Vous avez été désigné comme <strong>formateur référent</strong> pour le stage de
         <strong>${s.prenom} ${s.nom}</strong>.</p>
         <p>Sujet : ${s.sujetStage || 'à préciser'}</p>`,
        'Voir le dossier',
        `${appBase()}/app/stagiaires/${s.id}`
      ),
    });

    await sendEmail({
      to: s.email,
      subject: 'Votre formateur référent — CNI',
      html: emailTemplates.baseTemplate(
        'Formateur assigné',
        `<p>Bonjour <strong>${s.prenom}</strong>,</p>
         <p>Votre formateur référent est <strong>${f.prenom} ${f.nom}</strong> (${f.email}).</p>`,
      ),
    });

    logWorkflowEvent({
      workflow: 'stage-automation',
      entity: 'stagiaire',
      entityId: id,
      action: 'assign_formateur',
      actorId: user.id,
      metadata: { formateurId: f.id },
    });

    const fresh = await loadStag(id);
    return { message: 'Formateur assigné et notifié.', stagiaire: fresh };
  }

  static async sendSchedule(
    user: JwtPayload,
    id: number,
    body?: { scheduleStartAt?: string; scheduleEndAt?: string; message?: string }
  ) {
    const s = await loadStag(id);
    await assertCanAutomateStagiaire(user, s);
    if (!['Accepte', 'En_cours'].includes(s.statut)) {
      throw new AppError(400, 'Envoi du planning impossible : dossier non accepté.');
    }
    if (!s.dateDebutStage || !s.dateFinStage) {
      throw new AppError(400, 'Dates de stage manquantes : complétez le dossier avant d’envoyer le planning.');
    }

    const tuteur = s.tuteurId ? await Employe.findByPk(s.tuteurId) : null;
    const debut = new Date(s.dateDebutStage).toLocaleDateString('fr-FR');
    const fin = new Date(s.dateFinStage).toLocaleDateString('fr-FR');
    const scheduleStartAt = body?.scheduleStartAt ? new Date(body.scheduleStartAt) : null;
    const scheduleEndAt = body?.scheduleEndAt ? new Date(body.scheduleEndAt) : null;
    if (scheduleStartAt && Number.isNaN(scheduleStartAt.getTime())) {
      throw new AppError(400, 'Date/heure de début du planning invalide.');
    }
    if (scheduleEndAt && Number.isNaN(scheduleEndAt.getTime())) {
      throw new AppError(400, 'Date/heure de fin du planning invalide.');
    }
    if (scheduleStartAt && scheduleEndAt && scheduleStartAt >= scheduleEndAt) {
      throw new AppError(400, 'Le créneau du planning est invalide (début >= fin).');
    }
    const slotText = scheduleStartAt
      ? `<p><strong>Créneau retenu :</strong> ${scheduleStartAt.toLocaleString('fr-FR')}${
          scheduleEndAt ? ` → ${scheduleEndAt.toLocaleString('fr-FR')}` : ''
        }</p>`
      : '';
    const customMessage = body?.message?.trim() ? `<p>${escapeHtml(body.message.trim())}</p>` : '';

    await sendEmail({
      to: s.email,
      subject: '📅 Planning de votre stage — CNI',
      html: emailTemplates.baseTemplate(
        'Planning de présence',
        `<p>Bonjour <strong>${s.prenom}</strong>,</p>
         <p><strong>Période de stage :</strong> du ${debut} au ${fin}.</p>
         ${slotText}
         ${
           tuteur
             ? `<p><strong>Référent / superviseur :</strong> ${tuteur.prenom} ${tuteur.nom}<br/>
                Email : ${tuteur.email}<br/>
                ${tuteur.telephone ? `Tél. : ${tuteur.telephone}` : ''}</p>`
             : '<p><em>Le référent sera confirmé ultérieurement.</em></p>'
         }
         ${customMessage}
         <p>Merci de respecter les horaires convenus avec votre service d’accueil.</p>`
      ),
    });

    await s.update({ planningEnvoyeAt: new Date() });

    if (tuteur) {
      await sendEmail({
        to: tuteur.email,
        subject: `📅 Planning envoyé au stagiaire ${s.prenom} ${s.nom}`,
        html: emailTemplates.baseTemplate(
          'Information',
          `<p>Bonjour <strong>${tuteur.prenom}</strong>,</p>
           <p>Le planning a été communiqué au stagiaire pour la période du <strong>${debut}</strong> au <strong>${fin}</strong>.</p>`,
        ),
      });
    }

    logWorkflowEvent({
      workflow: 'stage-automation',
      entity: 'stagiaire',
      entityId: id,
      action: 'send_schedule',
      actorId: user.id,
    });

    const fresh = await loadStag(id);
    return { message: 'Planning envoyé par e-mail au stagiaire (et copie au référent).', stagiaire: fresh };
  }

  static async generateAttestation(user: JwtPayload, id: number) {
    const s = await loadStag(id);
    await assertCanAutomateStagiaire(user, s);
    if (s.attestationPath) {
      return { message: 'Attestation déjà disponible.', stagiaire: s };
    }
    const note = s.noteFinale ?? 0;
    const commentaire = String(s.evaluationFinale || 'Attestation générée automatiquement.');
    const att = await PdfService.genererAttestation(s, note, commentaire);
    await s.update({ attestationPath: att.path, statut: s.statut === 'Termine' ? s.statut : 'Termine' });
    const fresh = await loadStag(id);
    return { message: 'Attestation générée avec succès.', stagiaire: fresh };
  }

  static async uploadAttestation(user: JwtPayload, id: number, filePath?: string) {
    const s = await loadStag(id);
    await assertCanAutomateStagiaire(user, s);
    if (!filePath) {
      throw new AppError(400, 'Fichier attestation requis.');
    }
    await s.update({ attestationPath: filePath, statut: s.statut === 'Termine' ? s.statut : 'Termine' });
    const fresh = await loadStag(id);
    return { message: 'Attestation importée avec succès.', stagiaire: fresh };
  }

  static async closeStage(
    user: JwtPayload,
    id: number,
    body: { force?: boolean; noteFinale?: number; evaluationFinale?: string }
  ) {
    const s = await loadStag(id);
    await assertCanAutomateStagiaire(user, s);

    if (s.statut === 'Termine') {
      return { message: 'Stage déjà clôturé.', stagiaire: s };
    }
    if (s.statut !== 'En_cours') {
      throw new AppError(400, 'Clôture possible uniquement lorsque le stage est « En cours » (convention signée).');
    }
    if ((s.noteFinale == null || !String(s.evaluationFinale || '').trim()) && body.noteFinale != null && body.evaluationFinale) {
      await s.update({
        noteFinale: body.noteFinale,
        evaluationFinale: body.evaluationFinale.trim(),
      });
      await s.reload();
    }
    if (s.noteFinale == null || !String(s.evaluationFinale || '').trim()) {
      throw new AppError(400, 'Évaluation finale manquante : fournissez la note et le commentaire de fin.');
    }
    if (!s.dateFinStage) {
      throw new AppError(400, 'Date de fin du stage manquante.');
    }

    const fin = new Date(s.dateFinStage);
    fin.setHours(23, 59, 59, 999);
    const now = new Date();
    if (fin > now && !body.force) {
      throw new AppError(
        400,
        'La date de fin du stage n’est pas encore atteinte. Utilisez « force » (RH/manager uniquement) pour clôturer anticipativement.'
      );
    }
    if (fin > now && body.force && !isRh(user) && !isManager(user)) {
      throw new AppError(403, 'Clôture anticipée réservée à la RH ou au manager.');
    }

    let attPath = s.attestationPath;
    if (!attPath) {
      const att = await PdfService.genererAttestation(s, s.noteFinale!, s.evaluationFinale!);
      attPath = att.path;
    }
    await s.update({ statut: 'Termine', attestationPath: attPath });

    logWorkflowEvent({
      workflow: 'stage-automation',
      entity: 'stagiaire',
      entityId: id,
      action: 'close_stage',
      actorId: user.id,
    });

    const fresh = await loadStag(id);
    return {
      message: 'Stage clôturé. Attestation PDF générée ou mise à jour. Utilisez « Envoyer attestation » pour l’e-mail.',
      stagiaire: fresh,
    };
  }

  static async sendAttestation(user: JwtPayload, id: number) {
    const s = await loadStag(id);
    await assertCanAutomateStagiaire(user, s);
    if (!s.attestationPath) {
      throw new AppError(400, 'Aucun fichier d’attestation : clôturez d’abord le stage ou complétez le workflow.');
    }

    await sendEmail({
      to: s.email,
      subject: '🎓 Votre attestation de stage — CNI',
      html: emailTemplates.baseTemplate(
        'Attestation de stage',
        `<p>Bonjour <strong>${s.prenom} ${s.nom}</strong>,</p>
         <p>Veuillez trouver ci-joint votre <strong>attestation de stage</strong> officielle.</p>
         ${s.noteFinale != null ? `<p>Note finale enregistrée : <strong>${s.noteFinale}/5</strong>.</p>` : ''}
         <p>Nous vous remercions pour votre engagement au sein du CNI.</p>`,
      ),
      attachments: [{ filename: 'attestation_stage_CNI.pdf', path: s.attestationPath }],
    });

    logWorkflowEvent({
      workflow: 'stage-automation',
      entity: 'stagiaire',
      entityId: id,
      action: 'send_attestation_email',
      actorId: user.id,
    });

    return { message: 'Attestation envoyée par e-mail au stagiaire.', stagiaire: s };
  }

}
