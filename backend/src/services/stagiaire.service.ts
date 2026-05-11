import { Op } from 'sequelize';
import { Stagiaire, Employe, Departement, Formation } from '../models';
import { sendEmail, emailTemplates } from '../config/email';
import { PdfService } from './pdf.service';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../config/logger';
import { JwtPayload } from '../config/jwt';
import { assertCanAutomateStagiaire } from './stagiaireAccess.service';
import { parseCvBasic } from '../utils/cv-parser';
import { logWorkflowEvent } from '../utils/workflow-audit';
import { verifyOtpProofToken } from './otp.service';
import type { NiveauEtudes } from '../models/Stagiaire';
import { CvAnalysisService } from './cvAnalysis.service';
import path from 'path';

export class StagiaireService {
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

  // ============================================
  // WORKFLOW 1 : Réception candidature stage
  // ============================================

  /**
   * Soumettre une nouvelle candidature de stage
   * - Crée la fiche candidat
   * - Envoie email confirmation au candidat
   * - Notifie RH et responsable département
   */
  static async soumettreCandidature(
    data: Record<string, unknown>,
    files?: Record<string, unknown>,
    options?: { skipOtpVerification?: boolean; skipCvRequirement?: boolean }
  ) {
    const payload = data as {
      otpVerificationToken?: string;
      email: string;
      nom: string;
      prenom: string;
      telephone?: string;
      natureDemande?: 'stage' | 'formation';
      departementId?: number | string;
      dateDebutStage?: string;
      dateFinStage?: string;
      formationId?: number | string;
      formationTitre?: string;
      sujetStage?: string;
      typeStage?: string;
      specialite?: string;
      motivation?: string;
      rgpdConsenti?: boolean | string;
      ecoleUniversite?: string;
      niveauEtudes?: string;
    };
    const otpRequired = process.env.CANDIDATURE_OTP_REQUIRED !== 'false' && !options?.skipOtpVerification;
    if (otpRequired) {
      const token = payload.otpVerificationToken;
      if (!token) {
        throw new AppError(400, 'Vérification e-mail requise : demandez un code OTP puis validez-le.');
      }
      verifyOtpProofToken(token, payload.email, 'candidature');
    }
    delete payload.otpVerificationToken;

    // Vérifier que l'email n'est pas déjà candidat
    const existant = await Stagiaire.findOne({ where: { email: payload.email } });
    if (existant) {
      throw new AppError(409, 'Une candidature avec cet email existe déjà.');
    }

    const nature = payload.natureDemande === 'formation' ? 'formation' : 'stage';
    let departement = null as Departement | null;
    if (nature === 'stage') {
      if (!payload.departementId || !payload.dateDebutStage || !payload.dateFinStage) {
        throw new AppError(400, 'Pour une demande de stage, département et dates sont obligatoires.');
      }
      departement = await Departement.findByPk(Number(payload.departementId));
      if (!departement) throw new AppError(404, 'Département introuvable.');
    } else if (payload.departementId) {
      departement = await Departement.findByPk(Number(payload.departementId));
    }

    let requestedFormationTitle = '';
    if (nature === 'formation') {
      if (payload.formationId) {
        const f = await Formation.findByPk(Number(payload.formationId));
        if (!f || !f.isActif) throw new AppError(404, 'Formation introuvable.');
        requestedFormationTitle = f.titre;
      } else if (payload.formationTitre || payload.sujetStage) {
        requestedFormationTitle = String(payload.formationTitre || payload.sujetStage).trim();
      } else {
        throw new AppError(400, 'Pour une demande de formation, choisissez une formation existante ou saisissez un titre.');
      }
    }

    // Créer la fiche stagiaire
    const cvPath = (files as { cv?: Array<{ path?: string }> } | undefined)?.cv?.[0]?.path;
    if (!cvPath && !options?.skipCvRequirement) {
      throw new AppError(400, 'CV obligatoire: veuillez téléverser un fichier PDF, DOCX ou image (JPG, PNG, WebP).');
    }
    if (cvPath) {
      const ext = path.extname(cvPath).toLowerCase();
      if (!['.pdf', '.docx', '.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        throw new AppError(400, 'Format CV invalide: PDF, DOCX ou image (JPG, PNG, WebP).');
      }
    }
    const cvExtract = parseCvBasic(cvPath);
    const departementId = payload.departementId ? Number(payload.departementId) : undefined;
    const dateDebutStage = payload.dateDebutStage ? new Date(payload.dateDebutStage) : undefined;
    const dateFinStage = payload.dateFinStage ? new Date(payload.dateFinStage) : undefined;
    const niveauEtudes = payload.niveauEtudes as NiveauEtudes | undefined;

    const stagiaire = await Stagiaire.create({
      nom: payload.nom,
      prenom: payload.prenom,
      email: payload.email,
      telephone: typeof payload.telephone === 'string' ? payload.telephone : undefined,
      ecoleUniversite: payload.ecoleUniversite,
      niveauEtudes,
      specialite: typeof payload.specialite === 'string' ? payload.specialite : undefined,
      departementId,
      dateDebutStage,
      dateFinStage,
      motivation: typeof payload.motivation === 'string' ? payload.motivation : undefined,
      typeStage: nature === 'formation' ? 'Demande_Formation' : payload.typeStage,
      sujetStage:
        nature === 'formation'
          ? `Demande de formation: ${requestedFormationTitle}`
          : payload.sujetStage,
      cvPath,
      lettreMotivationPath: (files as { lettreMotivation?: Array<{ path?: string }> } | undefined)?.lettreMotivation?.[0]?.path,
      statut: 'En_attente',
      rgpdConsenti: payload.rgpdConsenti === 'true' || payload.rgpdConsenti === true,
      ...cvExtract,
      aiStatus: cvPath ? 'pending' : undefined,
    });

    if (cvPath) {
      try {
        const analysis = await CvAnalysisService.analyzeCv(cvPath);
        await stagiaire.update({
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
          cvNomExtrait: analysis.extractedData.name || cvExtract.cvNomExtrait,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Analyse CV impossible';
        await stagiaire.update({
          aiStatus: 'failed',
          aiError: msg.slice(0, 1000),
          aiAnalyzedAt: new Date(),
        });
        logger.warn(`Analyse IA CV échouée pour stagiaire #${stagiaire.id}: ${msg}`);
      }
    }

    // 🔔 Email confirmation candidat
    await sendEmail({
      to: payload.email,
      subject: '✅ Candidature reçue - CNI Stages',
      html: emailTemplates.confirmationCandidature(
        payload.nom,
        payload.prenom,
        departement?.nom || (nature === 'formation' ? 'Catalogue Formations' : '—')
      ),
    });

    const deptName = departement?.nom || (nature === 'formation' ? 'Catalogue Formations' : '—');

    // 🔔 Notification RH
    const rhUsers = await Employe.findAll({ where: { role: 'Direction_RH', isActif: true } });
    for (const rh of rhUsers) {
      await sendEmail({
        to: rh.email,
        subject: `📋 Nouvelle candidature de stage - ${payload.prenom} ${payload.nom}`,
        html: emailTemplates.notificationRH(payload.nom, payload.prenom, deptName, payload.email),
      });
    }

    // 🔔 Notification responsable département
    if (departement?.responsableId) {
      const responsable = await Employe.findByPk(departement.responsableId);
      if (responsable) {
        await sendEmail({
          to: responsable.email,
          subject: `📋 Nouvelle candidature pour votre département - ${payload.prenom} ${payload.nom}`,
          html: emailTemplates.baseTemplate(
            'Nouvelle candidature de stage',
            `<p>Bonjour <strong>${responsable.prenom}</strong>,</p>
             <p>Une nouvelle candidature de stage a été soumise pour le département <strong>${departement.nom}</strong>.</p>
             <p><strong>Candidat :</strong> ${payload.prenom} ${payload.nom}</p>
             <p><strong>École :</strong> ${payload.ecoleUniversite || 'Non précisé'}</p>
             <p><strong>Niveau :</strong> ${payload.niveauEtudes || 'Non précisé'}</p>`,
            'Voir la candidature',
            `${process.env.FRONTEND_URL}/rh/candidatures/${stagiaire.id}`
          ),
        });
      }
    }

    logger.info(`📝 Nouvelle candidature créée : ${payload.prenom} ${payload.nom} (#${stagiaire.id})`);
    logWorkflowEvent({
      workflow: 'stage-candidature-reception',
      entity: 'stagiaire',
      entityId: stagiaire.id,
      action: 'soumission',
      metadata: { departementId: payload.departementId, email: payload.email },
    });
    return stagiaire;
  }

  // ============================================
  // WORKFLOW 2 : Validation multi-niveaux
  // ============================================

  /**
   * Validation RH (première étape)
   */
  static async validerRH(stagiaireId: number, action: 'accepter' | 'refuser', commentaire?: string) {
    const stagiaire = await Stagiaire.findByPk(stagiaireId, {
      include: [{ model: Departement, as: 'departement' }],
    });
    if (!stagiaire) throw new AppError(404, 'Candidature introuvable.');
    if (stagiaire.statut !== 'En_attente' && stagiaire.statut !== 'En_examen') {
      throw new AppError(400, 'Cette candidature ne peut plus être traitée.');
    }

    if (action === 'refuser') {
      await stagiaire.update({
        statut: 'Refuse',
        commentaireRefus: commentaire,
        dateValidationRH: new Date(),
      });

      await sendEmail({
        to: stagiaire.email,
        subject: 'Résultat de votre candidature de stage - CNI',
        html: emailTemplates.baseTemplate(
          'Candidature non retenue',
          `<p>Bonjour <strong>${stagiaire.prenom} ${stagiaire.nom}</strong>,</p>
           <p>Après examen de votre dossier, nous sommes au regret de vous informer que votre candidature n'a pas été retenue.</p>
           ${commentaire ? `<p><strong>Motif :</strong> ${commentaire}</p>` : ''}
           <p>Nous vous remercions de votre intérêt pour CNI et vous souhaitons bonne chance dans vos recherches.</p>`
        ),
      });

      return { message: 'Candidature refusée avec notification.', stagiaire };
    }

    // Acceptation RH → passage au manager
    await stagiaire.update({ statut: 'En_examen', dateValidationRH: new Date() });

    // Informer le candidat que son dossier est validé RH et passe au manager
    await sendEmail({
      to: stagiaire.email,
      subject: '✅ Candidature validée par la RH — en attente manager',
      html: emailTemplates.baseTemplate(
        'Votre candidature avance',
        `<p>Bonjour <strong>${stagiaire.prenom} ${stagiaire.nom}</strong>,</p>
         <p>Votre candidature a été <strong>validée par la RH</strong>.</p>
         <p>Elle est maintenant en cours d’examen final par le manager du département.</p>`
      ),
    });

    // Notifier le manager du département
    if (stagiaire.departementId) {
      const dept = await Departement.findByPk(stagiaire.departementId);
      if (dept?.responsableId) {
        const manager = await Employe.findByPk(dept.responsableId);
        if (manager) {
          await sendEmail({
            to: manager.email,
            subject: `🔍 Candidature à valider - ${stagiaire.prenom} ${stagiaire.nom}`,
            html: emailTemplates.baseTemplate(
              'Validation requise - Candidature de stage',
              `<p>Bonjour <strong>${manager.prenom}</strong>,</p>
               <p>La RH vous soumet la candidature de <strong>${stagiaire.prenom} ${stagiaire.nom}</strong> pour validation finale.</p>`,
              'Valider / Refuser',
              `${process.env.FRONTEND_URL}/manager/candidatures/${stagiaireId}`
            ),
          });
        }
      }
    }

    logWorkflowEvent({
      workflow: 'stage-validation',
      entity: 'stagiaire',
      entityId: stagiaire.id,
      action: 'valide_rh',
      metadata: { statut: stagiaire.statut },
    });
    return { message: 'Candidature transmise au manager pour validation.', stagiaire };
  }

  /**
   * Validation Manager (deuxième étape → acceptation finale)
   */
  static async validerManager(
    stagiaireId: number,
    managerId: number,
    action: 'accepter' | 'refuser',
    data?: { tuteurId?: number; dateDebut?: string; dateFin?: string; sujet?: string; commentaire?: string }
  ) {
    const stagiaire = await Stagiaire.findByPk(stagiaireId);
    if (!stagiaire) throw new AppError(404, 'Candidature introuvable.');
    if (stagiaire.statut !== 'En_examen') {
      throw new AppError(400, 'Cette candidature n\'est pas en phase de validation manager.');
    }

    if (action === 'refuser') {
      await stagiaire.update({
        statut: 'Refuse',
        commentaireRefus: data?.commentaire,
        dateValidationManager: new Date(),
      });

      await sendEmail({
        to: stagiaire.email,
        subject: 'Résultat de votre candidature de stage - CNI',
        html: emailTemplates.baseTemplate(
          'Candidature non retenue',
          `<p>Bonjour <strong>${stagiaire.prenom}</strong>,</p>
           <p>Votre candidature n'a pas été retenue par le responsable du département.</p>
           ${data?.commentaire ? `<p><strong>Motif :</strong> ${data.commentaire}</p>` : ''}`
        ),
      });

      return { message: 'Candidature refusée.', stagiaire };
    }

    // Acceptation finale
    await stagiaire.update({
      statut: 'Accepte',
      dateValidationManager: new Date(),
      tuteurId: data?.tuteurId,
      dateDebutStage: data?.dateDebut ? new Date(data.dateDebut) : undefined,
      dateFinStage: data?.dateFin ? new Date(data.dateFin) : undefined,
      sujetStage: data?.sujet,
    });

    // Générer la convention de stage PDF
    const convention = await PdfService.genererConvention(stagiaire);
    await stagiaire.update({ conventionPath: convention.path });

    // Email de bienvenue avec la convention
    await sendEmail({
      to: stagiaire.email,
      subject: '🎉 Candidature acceptée - Convention de stage CNI',
      html: emailTemplates.baseTemplate(
        'Votre stage a été accepté !',
        `<p>Bonjour <strong>${stagiaire.prenom} ${stagiaire.nom}</strong>,</p>
         <p>Nous avons le plaisir de vous informer que votre candidature de stage a été <strong>acceptée</strong> !</p>
         <p>Vous trouverez ci-joint votre convention de stage. Veuillez la signer et nous la retourner.</p>
         ${data?.dateDebut ? `<p><strong>Date de début :</strong> ${new Date(data.dateDebut).toLocaleDateString('fr-FR')}</p>` : ''}
         ${data?.dateFin ? `<p><strong>Date de fin :</strong> ${new Date(data.dateFin).toLocaleDateString('fr-FR')}</p>` : ''}`
      ),
      attachments: [{ filename: 'convention_stage_CNI.pdf', path: convention.path }],
    });

    logger.info(`✅ Stage accepté : ${stagiaire.prenom} ${stagiaire.nom} (#${stagiaireId})`);
    logWorkflowEvent({
      workflow: 'stage-validation',
      entity: 'stagiaire',
      entityId: stagiaire.id,
      action: 'valide_manager',
      actorId: managerId,
      metadata: { statut: stagiaire.statut },
    });
    return { message: 'Stage accepté. Convention générée et envoyée.', stagiaire };
  }

  // ============================================
  // WORKFLOW 3 : Suivi automatique du stage
  // ============================================

  /**
   * Signature électronique de la convention (simulée)
   */
  static async signerConvention(stagiaireId: number, actor: JwtPayload) {
    const stagiaire = await Stagiaire.findByPk(stagiaireId);
    if (!stagiaire) throw new AppError(404, 'Stagiaire introuvable.');
    const isRh = actor.role === 'Direction_RH';
    const isOwner = actor.role === 'Stagiaire' && actor.id === stagiaire.id;
    if (!isRh && !isOwner) {
      throw new AppError(403, 'Accès refusé. Seul le stagiaire concerné (ou RH) peut signer.');
    }

    await stagiaire.update({
      conventionSignee: true,
      signatureDate: new Date(),
      statut: 'En_cours',
    });

    logger.info(`✍️ Convention signée : stagiaire #${stagiaireId}`);
    return { message: 'Convention signée. Stage démarré.', stagiaire };
  }

  /**
   * Envoyer les rappels automatiques (J-7, mi-parcours, J-14 avant fin)
   * À appeler quotidiennement via un cron job
   */
  static async envoyerRappels() {
    const now = new Date();
    const stagiairesEnCours = await Stagiaire.findAll({
      where: { statut: 'En_cours' },
      include: [{ model: Employe, as: 'tuteur' }],
    });

    let count = 0;
    for (const s of stagiairesEnCours) {
      if (!s.dateDebutStage || !s.dateFinStage) continue;

      const debut = new Date(s.dateDebutStage);
      const fin = new Date(s.dateFinStage);
      const diffDebut = Math.ceil((now.getTime() - debut.getTime()) / (1000 * 3600 * 24));
      const diffFin = Math.ceil((fin.getTime() - now.getTime()) / (1000 * 3600 * 24));
      const dureeTotal = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 3600 * 24));

      // J-7 avant début
      const diffAvantDebut = Math.ceil((debut.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (diffAvantDebut === 7) {
        await sendEmail({
          to: s.email,
          subject: 'Rappel : Votre stage commence dans 7 jours - CNI',
          html: emailTemplates.baseTemplate(
            'Votre stage commence bientôt !',
            `<p>Rappel : votre stage commence le <strong>${debut.toLocaleDateString('fr-FR')}</strong>.</p>`
          ),
        });
        count++;
      }

      // Mi-parcours
      if (Math.abs(diffDebut - dureeTotal / 2) <= 1 && s.noteIntermediaire === null) {
        if (s.tuteurId) {
          const tuteur = await Employe.findByPk(s.tuteurId);
          if (tuteur) {
            await sendEmail({
              to: tuteur.email,
              subject: `📊 Évaluation mi-parcours à soumettre - ${s.prenom} ${s.nom}`,
              html: emailTemplates.baseTemplate(
                'Évaluation mi-parcours requise',
                `<p>Le stage de <strong>${s.prenom} ${s.nom}</strong> est à mi-parcours. Merci de soumettre l'évaluation intermédiaire.</p>`,
                'Soumettre l\'évaluation',
                `${process.env.FRONTEND_URL}/tuteur/evaluations/${s.id}`
              ),
            });
            count++;
          }
        }
      }

      // 2 semaines avant fin
      if (diffFin === 14) {
        await sendEmail({
          to: s.email,
          subject: 'Votre stage se termine dans 2 semaines - CNI',
          html: emailTemplates.baseTemplate(
            'Fin de stage approche',
            `<p>Votre stage se termine le <strong>${fin.toLocaleDateString('fr-FR')}</strong>. N'oubliez pas de préparer votre rapport final.</p>`
          ),
        });
        count++;
      }
    }

    logger.info(`📅 Rappels envoyés : ${count}`);
    return { rappelsEnvoyes: count };
  }

  // ============================================
  // CRUD STAGIAIRES
  // ============================================

  static async getAll(filters: Record<string, unknown> = {}, viewer?: JwtPayload | null) {
    await StagiaireService.syncFinishedStagesByDate();
    const where: Record<string | symbol, unknown> = {};
    if (filters.statut) where.statut = filters.statut;
    if (filters.departementId) where.departementId = filters.departementId;
    if (filters.search) {
      where[Op.or] = [
        { nom: { [Op.like]: `%${filters.search}%` } },
        { prenom: { [Op.like]: `%${filters.search}%` } },
        { email: { [Op.like]: `%${filters.search}%` } },
      ];
    }

    if (viewer?.role === 'Employe' || viewer?.role === 'Formateur_Interne' || viewer?.role === 'Formateur_Externe') {
      where.tuteurId = viewer.id;
      where.projetPdfPath = { [Op.not]: null };
    }
    if (viewer?.role === 'Manager' && viewer.departementId) {
      where.departementId = viewer.departementId;
    }

    return Stagiaire.findAll({
      where,
      include: [
        { model: Departement, as: 'departement', attributes: ['id', 'nom'] },
        { model: Employe, as: 'tuteur', attributes: ['id', 'nom', 'prenom', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  static async getById(id: number, viewer?: JwtPayload | null) {
    await StagiaireService.syncFinishedStagesByDate();
    const stagiaire = await Stagiaire.findByPk(id, {
      include: [
        { model: Departement, as: 'departement' },
        { model: Employe, as: 'tuteur', attributes: ['id', 'nom', 'prenom', 'email', 'telephone'] },
      ],
    });
    if (!stagiaire) throw new AppError(404, 'Stagiaire introuvable.');
    if (viewer?.role === 'Stagiaire' && viewer.id !== stagiaire.id) {
      throw new AppError(403, 'Accès refusé.');
    }
    if (viewer && viewer.role !== 'Stagiaire') {
      await assertCanAutomateStagiaire(viewer, stagiaire);
      if (
        (viewer.role === 'Employe' || viewer.role === 'Formateur_Interne' || viewer.role === 'Formateur_Externe') &&
        !stagiaire.projetPdfPath
      ) {
        throw new AppError(403, 'Ce dossier n’est pas visible : projet non assigné par la RH.');
      }
    }
    return stagiaire;
  }

  static async update(id: number, data: Record<string, unknown>) {
    const stagiaire = await Stagiaire.findByPk(id);
    if (!stagiaire) throw new AppError(404, 'Stagiaire introuvable.');
    await stagiaire.update(data);
    return stagiaire;
  }
}
