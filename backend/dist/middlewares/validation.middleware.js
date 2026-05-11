"use strict";
// ============================================
// Fichier : middlewares/validation.middleware.ts
// Description : Validation des requêtes avec Zod
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeArchiveSchema = exports.createEmployeManagerSchema = exports.messageThreadParamsSchema = exports.sendMessageSchema = exports.employeRhActifSchema = exports.updateEmployeRhSchema = exports.createEmployeRhSchema = exports.inscriptionDecisionCommentSchema = exports.validationInscriptionSchema = exports.reponseOpportuniteSchema = exports.adminUpdateFormateurInterneSchema = exports.adminCreateFormateurInterneSchema = exports.inscriptionFormateurSchema = exports.signatureConventionSchema = exports.stagiaireWorkflowIdOnlySchema = exports.stagiaireWorkflowSendScheduleSchema = exports.stagiaireWorkflowCloseSchema = exports.stagiaireWorkflowAssignFormateurSchema = exports.stagiaireWorkflowAssignProjectSchema = exports.stagiaireWorkflowAcceptSchema = exports.validationStagiaireSchema = exports.idParamSchema = exports.creationFormationSchema = exports.demandeFormationSchema = exports.otpVerifySchema = exports.otpRequestSchema = exports.candidatureSchema = exports.refreshTokenSchema = exports.registerSchema = exports.loginSchema = exports.validate = void 0;
const zod_1 = require("zod");
/**
 * Middleware générique de validation Zod
 * Usage : validate(monSchema) dans une route
 */
const validate = (schema) => {
    return (req, res, next) => {
        try {
            // Valider le body, query et params
            const data = schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            req.body = data.body;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
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
exports.validate = validate;
// ============================================
// SCHÉMAS DE VALIDATION ZOD
// ============================================
// Authentification
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Email invalide'),
        password: zod_1.z.string().min(6, 'Mot de passe trop court (min 6 caractères)'),
    }),
});
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        nom: zod_1.z.string().min(2, 'Nom trop court').max(100),
        prenom: zod_1.z.string().min(2, 'Prénom trop court').max(100),
        email: zod_1.z.string().email('Email invalide'),
        password: zod_1.z.string().min(6, 'Mot de passe trop court').max(100),
        role: zod_1.z.enum(['Employe', 'Formateur_Interne', 'Formateur_Externe']).optional(),
        departementId: zod_1.z.number().int().positive(),
        telephone: zod_1.z.string().optional(),
        poste: zod_1.z.string().optional(),
        otpVerificationToken: zod_1.z.string().min(20).optional(),
    }),
});
exports.refreshTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(20, 'Refresh token invalide'),
    }),
});
// Candidature stagiaire (multipart : types souvent string)
exports.candidatureSchema = zod_1.z.object({
    body: zod_1.z.object({
        nom: zod_1.z.string().min(2).max(100),
        prenom: zod_1.z.string().min(2).max(100),
        email: zod_1.z.string().email(),
        natureDemande: zod_1.z.enum(['stage', 'formation']).optional(),
        telephone: zod_1.z.string().optional(),
        ecoleUniversite: zod_1.z.string().optional(),
        niveauEtudes: zod_1.z.enum(['Licence_1', 'Licence_2', 'Licence_3', 'Master_1', 'Master_2', 'Ingenieur', 'Doctorat', 'Autre']).optional(),
        specialite: zod_1.z.string().optional(),
        departementId: zod_1.z.coerce.number().optional(),
        dateDebutStage: zod_1.z.string().optional(),
        dateFinStage: zod_1.z.string().optional(),
        formationId: zod_1.z.coerce.number().optional(),
        formationTitre: zod_1.z.string().max(300).optional(),
        sujetStage: zod_1.z.string().optional(),
        typeStage: zod_1.z.string().optional(),
        motivation: zod_1.z.string().optional(),
        rgpdConsenti: zod_1.z
            .union([zod_1.z.boolean(), zod_1.z.string()])
            .transform((v) => v === true || v === 'true')
            .refine((v) => v === true, { message: 'Vous devez accepter la politique RGPD' }),
        /** Jeton retourné par POST /auth/otp/candidature/verify (sauf si CANDIDATURE_OTP_REQUIRED=false) */
        otpVerificationToken: zod_1.z.string().min(20).optional(),
    }),
});
exports.otpRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
    }),
});
exports.otpVerifySchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        code: zod_1.z.string().min(4).max(10),
    }),
});
// Demande de formation
exports.demandeFormationSchema = zod_1.z.object({
    body: zod_1.z.object({
        formationId: zod_1.z.number().optional(),
        // Nouvelle formation
        titreFormation: zod_1.z.string().optional(),
        domaine: zod_1.z.string().optional(),
        justification: zod_1.z.string().min(20, 'Justification trop courte (min 20 caractères)'),
        coutEstime: zod_1.z.number().optional(),
        dureeEstimee: zod_1.z.number().optional(),
    }),
});
// Création formation
exports.creationFormationSchema = zod_1.z.object({
    body: zod_1.z.object({
        titre: zod_1.z.string().min(5).max(300),
        description: zod_1.z.string().optional(),
        domaine: zod_1.z.enum(['Informatique', 'Management', 'Communication', 'Finance', 'RH', 'Securite', 'Langue', 'Technique', 'Autre']),
        type: zod_1.z.enum(['Interne', 'Externe', 'E_learning', 'Mixte', 'Certification']),
        niveau: zod_1.z.string().optional(),
        dureeJours: zod_1.z.number().optional(),
        dureeHeures: zod_1.z.number().optional(),
        dateDebut: zod_1.z.string().optional(),
        dateFin: zod_1.z.string().optional(),
        lieu: zod_1.z.string().optional(),
        maxParticipants: zod_1.z.number().optional(),
        cout: zod_1.z.number().optional(),
        formateurId: zod_1.z.number().optional(),
        objectifs: zod_1.z.string().optional(),
        prerequis: zod_1.z.string().optional(),
        programme: zod_1.z.string().optional(),
    }),
});
// Schéma commun pour les paramètres :id
exports.idParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, 'Identifiant invalide'),
    }),
});
// Validation RH/Manager des candidatures
exports.validationStagiaireSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, 'Identifiant stagiaire invalide'),
    }),
    body: zod_1.z.object({
        action: zod_1.z.enum(['accepter', 'refuser']),
        commentaire: zod_1.z.string().max(1000).optional(),
        tuteurId: zod_1.z.number().int().positive().optional(),
        dateDebut: zod_1.z.string().optional(),
        dateFin: zod_1.z.string().optional(),
        sujet: zod_1.z.string().max(300).optional(),
    }),
});
/** Automatisation workflow stage (un clic) */
exports.stagiaireWorkflowAcceptSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().regex(/^\d+$/) }),
    body: zod_1.z.object({
        commentaire: zod_1.z.string().max(1000).optional(),
        tuteurId: zod_1.z.number().int().positive().optional(),
        dateDebut: zod_1.z.string().optional(),
        dateFin: zod_1.z.string().optional(),
        sujet: zod_1.z.string().max(300).optional(),
    }),
});
exports.stagiaireWorkflowAssignProjectSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().regex(/^\d+$/) }),
    body: zod_1.z.object({
        titre: zod_1.z.string().min(3).max(300).optional(),
        description: zod_1.z.string().max(8000).optional(),
        departementId: zod_1.z.number().int().positive().optional(),
        formateurId: zod_1.z.number().int().positive().optional(),
        formationId: zod_1.z.number().int().positive().optional(),
    }),
});
exports.stagiaireWorkflowAssignFormateurSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().regex(/^\d+$/) }),
    body: zod_1.z.object({ formateurId: zod_1.z.number().int().positive() }),
});
exports.stagiaireWorkflowCloseSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().regex(/^\d+$/) }),
    body: zod_1.z.object({
        force: zod_1.z.boolean().optional(),
        noteFinale: zod_1.z.number().min(0).max(5).optional(),
        evaluationFinale: zod_1.z.string().min(3).max(4000).optional(),
    }),
});
exports.stagiaireWorkflowSendScheduleSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().regex(/^\d+$/) }),
    body: zod_1.z.object({
        scheduleStartAt: zod_1.z.string().datetime().optional(),
        scheduleEndAt: zod_1.z.string().datetime().optional(),
        message: zod_1.z.string().max(1200).optional(),
    }),
});
exports.stagiaireWorkflowIdOnlySchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().regex(/^\d+$/) }),
    body: zod_1.z.object({}).optional(),
});
// Signature électronique simulée
exports.signatureConventionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, 'Identifiant stagiaire invalide'),
    }),
});
// Inscription formateur interne
exports.inscriptionFormateurSchema = zod_1.z.object({
    body: zod_1.z.object({
        domainesCompetences: zod_1.z.array(zod_1.z.string().min(2)).min(1, 'Au moins une compétence est requise'),
        disponibiliteHeures: zod_1.z.number().int().min(1).max(200),
        motivation: zod_1.z.string().max(1000).optional(),
    }),
});
/** Création d’un compte formateur interne par Direction RH / Manager */
exports.adminCreateFormateurInterneSchema = zod_1.z.object({
    body: zod_1.z.object({
        nom: zod_1.z.string().min(2, 'Nom trop court').max(100),
        prenom: zod_1.z.string().min(2, 'Prénom trop court').max(100),
        email: zod_1.z.string().email('Email invalide'),
        motDePasse: zod_1.z.string().min(6, 'Mot de passe trop court (min 6)').max(100),
        departementId: zod_1.z.number().int().positive().optional(),
        poste: zod_1.z.string().max(150).optional(),
        telephone: zod_1.z.string().max(20).optional(),
        domainesCompetences: zod_1.z.array(zod_1.z.string().min(2)).min(1, 'Au moins une compétence est requise'),
        disponibiliteHeures: zod_1.z.number().int().min(1).max(200),
    }),
});
/** Mise à jour d’un formateur interne par Direction RH / Manager */
exports.adminUpdateFormateurInterneSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, 'Identifiant invalide'),
    }),
    body: zod_1.z.object({
        nom: zod_1.z.string().min(2).max(100).optional(),
        prenom: zod_1.z.string().min(2).max(100).optional(),
        email: zod_1.z.string().email().optional(),
        motDePasse: zod_1.z.string().min(6).max(100).optional(),
        departementId: zod_1.z.number().int().positive().nullable().optional(),
        poste: zod_1.z.string().max(150).optional(),
        telephone: zod_1.z.string().max(20).optional(),
        domainesCompetences: zod_1.z.array(zod_1.z.string().min(2)).min(1).optional(),
        disponibiliteHeures: zod_1.z.number().int().min(1).max(200).optional(),
        isActif: zod_1.z.boolean().optional(),
        isArchived: zod_1.z.boolean().optional(),
    }),
});
// Réponse à une opportunité de formation
exports.reponseOpportuniteSchema = zod_1.z.object({
    params: zod_1.z.object({
        demandeId: zod_1.z.string().regex(/^\d+$/, 'Identifiant demande invalide'),
    }),
    body: zod_1.z.object({
        action: zod_1.z.enum(['accepter', 'refuser']),
        commentaire: zod_1.z.string().max(1000).optional(),
    }),
});
// Validation manager / RH inscription formation (aligné sur FormationService : valider | refuser)
exports.validationInscriptionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, 'Identifiant inscription invalide'),
    }),
    body: zod_1.z.object({
        action: zod_1.z.enum(['valider', 'refuser']),
        commentaire: zod_1.z.string().max(1000).optional(),
    }),
});
/** Accept / reject dédiés (corps optionnel : commentaire) */
exports.inscriptionDecisionCommentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, 'Identifiant inscription invalide'),
    }),
    body: zod_1.z.object({
        commentaire: zod_1.z.string().max(1000).optional(),
    }),
});
/** Création d’employé / manager par la Direction RH */
exports.createEmployeRhSchema = zod_1.z.object({
    body: zod_1.z.object({
        nom: zod_1.z.string().min(2).max(100),
        prenom: zod_1.z.string().min(2).max(100),
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(6).max(100),
        role: zod_1.z.enum(['Manager', 'Employe', 'Formateur_Interne', 'Formateur_Externe']),
        departementId: zod_1.z.number().int().positive(),
        poste: zod_1.z.string().max(150).optional(),
        telephone: zod_1.z.string().max(20).optional(),
    }),
});
exports.updateEmployeRhSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, 'Identifiant invalide'),
    }),
    body: zod_1.z
        .object({
        nom: zod_1.z.string().min(2).max(100).optional(),
        prenom: zod_1.z.string().min(2).max(100).optional(),
        email: zod_1.z.string().email().optional(),
        poste: zod_1.z.string().max(150).optional(),
        telephone: zod_1.z.string().max(20).optional(),
        departementId: zod_1.z.number().int().positive().optional(),
        password: zod_1.z.string().min(6).max(100).optional(),
    })
        .refine((b) => Object.keys(b).length > 0, { message: 'Au moins un champ à mettre à jour' }),
});
exports.employeRhActifSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, 'Identifiant invalide'),
    }),
    body: zod_1.z.object({
        isActif: zod_1.z.boolean(),
    }),
});
exports.sendMessageSchema = zod_1.z.object({
    body: zod_1.z.object({
        recipientId: zod_1.z.number().int().positive(),
        body: zod_1.z.string().min(1).max(8000),
    }),
});
exports.messageThreadParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        otherId: zod_1.z.string().regex(/^\d+$/, 'Identifiant invalide'),
    }),
});
exports.createEmployeManagerSchema = zod_1.z.object({
    body: zod_1.z.object({
        nom: zod_1.z.string().min(2).max(100),
        prenom: zod_1.z.string().min(2).max(100),
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(6).max(100),
        role: zod_1.z.enum(['Manager', 'Employe', 'Formateur_Interne', 'Formateur_Externe']),
        poste: zod_1.z.string().max(150).optional(),
        telephone: zod_1.z.string().max(20).optional(),
    }),
});
exports.employeArchiveSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, 'Identifiant invalide'),
    }),
    body: zod_1.z.object({
        isArchived: zod_1.z.boolean(),
    }),
});
//# sourceMappingURL=validation.middleware.js.map