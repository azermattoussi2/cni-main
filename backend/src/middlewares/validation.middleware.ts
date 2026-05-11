// ============================================
// Fichier : middlewares/validation.middleware.ts
// Description : Validation des requêtes avec Zod
// ============================================

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Middleware générique de validation Zod
 * Usage : validate(monSchema) dans une route
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Valider le body, query et params
      const data = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = data.body;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: error.errors.map((e) => ({
            champ: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

// ============================================
// SCHÉMAS DE VALIDATION ZOD
// ============================================

// Authentification
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Mot de passe trop court (min 6 caractères)'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    nom: z.string().min(2, 'Nom trop court').max(100),
    prenom: z.string().min(2, 'Prénom trop court').max(100),
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Mot de passe trop court').max(100),
    role: z.enum(['Employe', 'Formateur_Interne', 'Formateur_Externe']).optional(),
    departementId: z.number().int().positive(),
    telephone: z.string().optional(),
    poste: z.string().optional(),
    otpVerificationToken: z.string().min(20).optional(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(20, 'Refresh token invalide'),
  }),
});

// Candidature stagiaire (multipart : types souvent string)
export const candidatureSchema = z.object({
  body: z.object({
    nom: z.string().min(2).max(100),
    prenom: z.string().min(2).max(100),
    email: z.string().email(),
    natureDemande: z.enum(['stage', 'formation']).optional(),
    telephone: z.string().optional(),
    ecoleUniversite: z.string().optional(),
    niveauEtudes: z.enum(['Licence_1','Licence_2','Licence_3','Master_1','Master_2','Ingenieur','Doctorat','Autre']).optional(),
    specialite: z.string().optional(),
    departementId: z.coerce.number().optional(),
    dateDebutStage: z.string().optional(),
    dateFinStage: z.string().optional(),
    formationId: z.coerce.number().optional(),
    formationTitre: z.string().max(300).optional(),
    sujetStage: z.string().optional(),
    typeStage: z.string().optional(),
    motivation: z.string().optional(),
    rgpdConsenti: z
      .union([z.boolean(), z.string()])
      .transform((v) => v === true || v === 'true')
      .refine((v) => v === true, { message: 'Vous devez accepter la politique RGPD' }),
    /** Jeton retourné par POST /auth/otp/candidature/verify (sauf si CANDIDATURE_OTP_REQUIRED=false) */
    otpVerificationToken: z.string().min(20).optional(),
  }),
});

export const otpRequestSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const otpVerifySchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().min(4).max(10),
  }),
});

// Demande de formation
export const demandeFormationSchema = z.object({
  body: z.object({
    formationId: z.number().optional(),
    // Nouvelle formation
    titreFormation: z.string().optional(),
    domaine: z.string().optional(),
    justification: z.string().min(20, 'Justification trop courte (min 20 caractères)'),
    coutEstime: z.number().optional(),
    dureeEstimee: z.number().optional(),
  }),
});

// Création formation
export const creationFormationSchema = z.object({
  body: z.object({
    titre: z.string().min(5).max(300),
    description: z.string().optional(),
    domaine: z.enum(['Informatique','Management','Communication','Finance','RH','Securite','Langue','Technique','Autre']),
    type: z.enum(['Interne','Externe','E_learning','Mixte','Certification']),
    niveau: z.string().optional(),
    dureeJours: z.number().optional(),
    dureeHeures: z.number().optional(),
    dateDebut: z.string().optional(),
    dateFin: z.string().optional(),
    lieu: z.string().optional(),
    maxParticipants: z.number().optional(),
    cout: z.number().optional(),
    formateurId: z.number().optional(),
    objectifs: z.string().optional(),
    prerequis: z.string().optional(),
    programme: z.string().optional(),
  }),
});

// Schéma commun pour les paramètres :id
export const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Identifiant invalide'),
  }),
});

// Validation RH/Manager des candidatures
export const validationStagiaireSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Identifiant stagiaire invalide'),
  }),
  body: z.object({
    action: z.enum(['accepter', 'refuser']),
    commentaire: z.string().max(1000).optional(),
    tuteurId: z.number().int().positive().optional(),
    dateDebut: z.string().optional(),
    dateFin: z.string().optional(),
    sujet: z.string().max(300).optional(),
  }),
});

/** Automatisation workflow stage (un clic) */
export const stagiaireWorkflowAcceptSchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  body: z.object({
    commentaire: z.string().max(1000).optional(),
    tuteurId: z.number().int().positive().optional(),
    dateDebut: z.string().optional(),
    dateFin: z.string().optional(),
    sujet: z.string().max(300).optional(),
  }),
});

export const stagiaireWorkflowAssignProjectSchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  body: z.object({
    titre: z.string().min(3).max(300).optional(),
    description: z.string().max(8000).optional(),
    departementId: z.number().int().positive().optional(),
    formateurId: z.number().int().positive().optional(),
    formationId: z.number().int().positive().optional(),
  }),
});

export const stagiaireWorkflowAssignFormateurSchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  body: z.object({ formateurId: z.number().int().positive() }),
});

export const stagiaireWorkflowCloseSchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  body: z.object({
    force: z.boolean().optional(),
    noteFinale: z.number().min(0).max(5).optional(),
    evaluationFinale: z.string().min(3).max(4000).optional(),
  }),
});

export const stagiaireWorkflowSendScheduleSchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  body: z.object({
    scheduleStartAt: z.string().datetime().optional(),
    scheduleEndAt: z.string().datetime().optional(),
    message: z.string().max(1200).optional(),
  }),
});

export const stagiaireWorkflowIdOnlySchema = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/) }),
  body: z.object({}).optional(),
});

// Signature électronique simulée
export const signatureConventionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Identifiant stagiaire invalide'),
  }),
});

// Inscription formateur interne
export const inscriptionFormateurSchema = z.object({
  body: z.object({
    domainesCompetences: z.array(z.string().min(2)).min(1, 'Au moins une compétence est requise'),
    disponibiliteHeures: z.number().int().min(1).max(200),
    motivation: z.string().max(1000).optional(),
  }),
});

/** Création d’un compte formateur interne par Direction RH / Manager */
export const adminCreateFormateurInterneSchema = z.object({
  body: z.object({
    nom: z.string().min(2, 'Nom trop court').max(100),
    prenom: z.string().min(2, 'Prénom trop court').max(100),
    email: z.string().email('Email invalide'),
    motDePasse: z.string().min(6, 'Mot de passe trop court (min 6)').max(100),
    departementId: z.number().int().positive().optional(),
    poste: z.string().max(150).optional(),
    telephone: z.string().max(20).optional(),
    domainesCompetences: z.array(z.string().min(2)).min(1, 'Au moins une compétence est requise'),
    disponibiliteHeures: z.number().int().min(1).max(200),
  }),
});

/** Mise à jour d’un formateur interne par Direction RH / Manager */
export const adminUpdateFormateurInterneSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Identifiant invalide'),
  }),
  body: z.object({
    nom: z.string().min(2).max(100).optional(),
    prenom: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    motDePasse: z.string().min(6).max(100).optional(),
    departementId: z.number().int().positive().nullable().optional(),
    poste: z.string().max(150).optional(),
    telephone: z.string().max(20).optional(),
    domainesCompetences: z.array(z.string().min(2)).min(1).optional(),
    disponibiliteHeures: z.number().int().min(1).max(200).optional(),
    isActif: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  }),
});

// Réponse à une opportunité de formation
export const reponseOpportuniteSchema = z.object({
  params: z.object({
    demandeId: z.string().regex(/^\d+$/, 'Identifiant demande invalide'),
  }),
  body: z.object({
    action: z.enum(['accepter', 'refuser']),
    commentaire: z.string().max(1000).optional(),
  }),
});

// Validation manager / RH inscription formation (aligné sur FormationService : valider | refuser)
export const validationInscriptionSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Identifiant inscription invalide'),
  }),
  body: z.object({
    action: z.enum(['valider', 'refuser']),
    commentaire: z.string().max(1000).optional(),
  }),
});

/** Accept / reject dédiés (corps optionnel : commentaire) */
export const inscriptionDecisionCommentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Identifiant inscription invalide'),
  }),
  body: z.object({
    commentaire: z.string().max(1000).optional(),
  }),
});

/** Création d’employé / manager par la Direction RH */
export const createEmployeRhSchema = z.object({
  body: z.object({
    nom: z.string().min(2).max(100),
    prenom: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(6).max(100),
    role: z.enum(['Manager', 'Employe', 'Formateur_Interne', 'Formateur_Externe']),
    departementId: z.number().int().positive(),
    poste: z.string().max(150).optional(),
    telephone: z.string().max(20).optional(),
  }),
});

export const updateEmployeRhSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Identifiant invalide'),
  }),
  body: z
    .object({
      nom: z.string().min(2).max(100).optional(),
      prenom: z.string().min(2).max(100).optional(),
      email: z.string().email().optional(),
      poste: z.string().max(150).optional(),
      telephone: z.string().max(20).optional(),
      departementId: z.number().int().positive().optional(),
      password: z.string().min(6).max(100).optional(),
    })
    .refine((b) => Object.keys(b).length > 0, { message: 'Au moins un champ à mettre à jour' }),
});

export const employeRhActifSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Identifiant invalide'),
  }),
  body: z.object({
    isActif: z.boolean(),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    recipientId: z.number().int().positive(),
    body: z.string().min(1).max(8000),
  }),
});

export const messageThreadParamsSchema = z.object({
  params: z.object({
    otherId: z.string().regex(/^\d+$/, 'Identifiant invalide'),
  }),
});

export const createEmployeManagerSchema = z.object({
  body: z.object({
    nom: z.string().min(2).max(100),
    prenom: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(6).max(100),
    role: z.enum(['Manager', 'Employe', 'Formateur_Interne', 'Formateur_Externe']),
    poste: z.string().max(150).optional(),
    telephone: z.string().max(20).optional(),
  }),
});

export const employeArchiveSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Identifiant invalide'),
  }),
  body: z.object({
    isArchived: z.boolean(),
  }),
});
