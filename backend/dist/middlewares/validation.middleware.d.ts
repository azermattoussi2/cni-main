import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
/**
 * Middleware générique de validation Zod
 * Usage : validate(monSchema) dans une route
 */
export declare const validate: (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const loginSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
    }, {
        email: string;
        password: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        password: string;
    };
}, {
    body: {
        email: string;
        password: string;
    };
}>;
export declare const registerSchema: z.ZodObject<{
    body: z.ZodObject<{
        nom: z.ZodString;
        prenom: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        role: z.ZodOptional<z.ZodEnum<["Employe", "Formateur_Interne", "Formateur_Externe"]>>;
        departementId: z.ZodNumber;
        telephone: z.ZodOptional<z.ZodString>;
        poste: z.ZodOptional<z.ZodString>;
        otpVerificationToken: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        nom: string;
        prenom: string;
        email: string;
        departementId: number;
        password: string;
        telephone?: string | undefined;
        poste?: string | undefined;
        role?: "Employe" | "Formateur_Interne" | "Formateur_Externe" | undefined;
        otpVerificationToken?: string | undefined;
    }, {
        nom: string;
        prenom: string;
        email: string;
        departementId: number;
        password: string;
        telephone?: string | undefined;
        poste?: string | undefined;
        role?: "Employe" | "Formateur_Interne" | "Formateur_Externe" | undefined;
        otpVerificationToken?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        nom: string;
        prenom: string;
        email: string;
        departementId: number;
        password: string;
        telephone?: string | undefined;
        poste?: string | undefined;
        role?: "Employe" | "Formateur_Interne" | "Formateur_Externe" | undefined;
        otpVerificationToken?: string | undefined;
    };
}, {
    body: {
        nom: string;
        prenom: string;
        email: string;
        departementId: number;
        password: string;
        telephone?: string | undefined;
        poste?: string | undefined;
        role?: "Employe" | "Formateur_Interne" | "Formateur_Externe" | undefined;
        otpVerificationToken?: string | undefined;
    };
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    body: z.ZodObject<{
        refreshToken: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        refreshToken: string;
    }, {
        refreshToken: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        refreshToken: string;
    };
}, {
    body: {
        refreshToken: string;
    };
}>;
export declare const candidatureSchema: z.ZodObject<{
    body: z.ZodObject<{
        nom: z.ZodString;
        prenom: z.ZodString;
        email: z.ZodString;
        natureDemande: z.ZodOptional<z.ZodEnum<["stage", "formation"]>>;
        telephone: z.ZodOptional<z.ZodString>;
        ecoleUniversite: z.ZodOptional<z.ZodString>;
        niveauEtudes: z.ZodOptional<z.ZodEnum<["Licence_1", "Licence_2", "Licence_3", "Master_1", "Master_2", "Ingenieur", "Doctorat", "Autre"]>>;
        specialite: z.ZodOptional<z.ZodString>;
        departementId: z.ZodOptional<z.ZodNumber>;
        dateDebutStage: z.ZodOptional<z.ZodString>;
        dateFinStage: z.ZodOptional<z.ZodString>;
        formationId: z.ZodOptional<z.ZodNumber>;
        formationTitre: z.ZodOptional<z.ZodString>;
        sujetStage: z.ZodOptional<z.ZodString>;
        typeStage: z.ZodOptional<z.ZodString>;
        motivation: z.ZodOptional<z.ZodString>;
        rgpdConsenti: z.ZodEffects<z.ZodEffects<z.ZodUnion<[z.ZodBoolean, z.ZodString]>, boolean, string | boolean>, boolean, string | boolean>;
        /** Jeton retourné par POST /auth/otp/candidature/verify (sauf si CANDIDATURE_OTP_REQUIRED=false) */
        otpVerificationToken: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        nom: string;
        prenom: string;
        email: string;
        rgpdConsenti: boolean;
        telephone?: string | undefined;
        departementId?: number | undefined;
        ecoleUniversite?: string | undefined;
        niveauEtudes?: "Licence_1" | "Licence_2" | "Licence_3" | "Master_1" | "Master_2" | "Ingenieur" | "Doctorat" | "Autre" | undefined;
        specialite?: string | undefined;
        dateDebutStage?: string | undefined;
        dateFinStage?: string | undefined;
        sujetStage?: string | undefined;
        typeStage?: string | undefined;
        motivation?: string | undefined;
        formationId?: number | undefined;
        otpVerificationToken?: string | undefined;
        natureDemande?: "formation" | "stage" | undefined;
        formationTitre?: string | undefined;
    }, {
        nom: string;
        prenom: string;
        email: string;
        rgpdConsenti: string | boolean;
        telephone?: string | undefined;
        departementId?: number | undefined;
        ecoleUniversite?: string | undefined;
        niveauEtudes?: "Licence_1" | "Licence_2" | "Licence_3" | "Master_1" | "Master_2" | "Ingenieur" | "Doctorat" | "Autre" | undefined;
        specialite?: string | undefined;
        dateDebutStage?: string | undefined;
        dateFinStage?: string | undefined;
        sujetStage?: string | undefined;
        typeStage?: string | undefined;
        motivation?: string | undefined;
        formationId?: number | undefined;
        otpVerificationToken?: string | undefined;
        natureDemande?: "formation" | "stage" | undefined;
        formationTitre?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        nom: string;
        prenom: string;
        email: string;
        rgpdConsenti: boolean;
        telephone?: string | undefined;
        departementId?: number | undefined;
        ecoleUniversite?: string | undefined;
        niveauEtudes?: "Licence_1" | "Licence_2" | "Licence_3" | "Master_1" | "Master_2" | "Ingenieur" | "Doctorat" | "Autre" | undefined;
        specialite?: string | undefined;
        dateDebutStage?: string | undefined;
        dateFinStage?: string | undefined;
        sujetStage?: string | undefined;
        typeStage?: string | undefined;
        motivation?: string | undefined;
        formationId?: number | undefined;
        otpVerificationToken?: string | undefined;
        natureDemande?: "formation" | "stage" | undefined;
        formationTitre?: string | undefined;
    };
}, {
    body: {
        nom: string;
        prenom: string;
        email: string;
        rgpdConsenti: string | boolean;
        telephone?: string | undefined;
        departementId?: number | undefined;
        ecoleUniversite?: string | undefined;
        niveauEtudes?: "Licence_1" | "Licence_2" | "Licence_3" | "Master_1" | "Master_2" | "Ingenieur" | "Doctorat" | "Autre" | undefined;
        specialite?: string | undefined;
        dateDebutStage?: string | undefined;
        dateFinStage?: string | undefined;
        sujetStage?: string | undefined;
        typeStage?: string | undefined;
        motivation?: string | undefined;
        formationId?: number | undefined;
        otpVerificationToken?: string | undefined;
        natureDemande?: "formation" | "stage" | undefined;
        formationTitre?: string | undefined;
    };
}>;
export declare const otpRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
    }, {
        email: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
    };
}, {
    body: {
        email: string;
    };
}>;
export declare const otpVerifySchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        code: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        code: string;
    }, {
        email: string;
        code: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        code: string;
    };
}, {
    body: {
        email: string;
        code: string;
    };
}>;
export declare const demandeFormationSchema: z.ZodObject<{
    body: z.ZodObject<{
        formationId: z.ZodOptional<z.ZodNumber>;
        titreFormation: z.ZodOptional<z.ZodString>;
        domaine: z.ZodOptional<z.ZodString>;
        justification: z.ZodString;
        coutEstime: z.ZodOptional<z.ZodNumber>;
        dureeEstimee: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        justification: string;
        domaine?: string | undefined;
        formationId?: number | undefined;
        titreFormation?: string | undefined;
        coutEstime?: number | undefined;
        dureeEstimee?: number | undefined;
    }, {
        justification: string;
        domaine?: string | undefined;
        formationId?: number | undefined;
        titreFormation?: string | undefined;
        coutEstime?: number | undefined;
        dureeEstimee?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        justification: string;
        domaine?: string | undefined;
        formationId?: number | undefined;
        titreFormation?: string | undefined;
        coutEstime?: number | undefined;
        dureeEstimee?: number | undefined;
    };
}, {
    body: {
        justification: string;
        domaine?: string | undefined;
        formationId?: number | undefined;
        titreFormation?: string | undefined;
        coutEstime?: number | undefined;
        dureeEstimee?: number | undefined;
    };
}>;
export declare const creationFormationSchema: z.ZodObject<{
    body: z.ZodObject<{
        titre: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        domaine: z.ZodEnum<["Informatique", "Management", "Communication", "Finance", "RH", "Securite", "Langue", "Technique", "Autre"]>;
        type: z.ZodEnum<["Interne", "Externe", "E_learning", "Mixte", "Certification"]>;
        niveau: z.ZodOptional<z.ZodString>;
        dureeJours: z.ZodOptional<z.ZodNumber>;
        dureeHeures: z.ZodOptional<z.ZodNumber>;
        dateDebut: z.ZodOptional<z.ZodString>;
        dateFin: z.ZodOptional<z.ZodString>;
        lieu: z.ZodOptional<z.ZodString>;
        maxParticipants: z.ZodOptional<z.ZodNumber>;
        cout: z.ZodOptional<z.ZodNumber>;
        formateurId: z.ZodOptional<z.ZodNumber>;
        objectifs: z.ZodOptional<z.ZodString>;
        prerequis: z.ZodOptional<z.ZodString>;
        programme: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "Interne" | "Externe" | "E_learning" | "Mixte" | "Certification";
        titre: string;
        domaine: "Autre" | "Informatique" | "Management" | "Communication" | "Finance" | "RH" | "Securite" | "Langue" | "Technique";
        description?: string | undefined;
        niveau?: string | undefined;
        dureeJours?: number | undefined;
        dureeHeures?: number | undefined;
        dateDebut?: string | undefined;
        dateFin?: string | undefined;
        lieu?: string | undefined;
        maxParticipants?: number | undefined;
        cout?: number | undefined;
        formateurId?: number | undefined;
        objectifs?: string | undefined;
        prerequis?: string | undefined;
        programme?: string | undefined;
    }, {
        type: "Interne" | "Externe" | "E_learning" | "Mixte" | "Certification";
        titre: string;
        domaine: "Autre" | "Informatique" | "Management" | "Communication" | "Finance" | "RH" | "Securite" | "Langue" | "Technique";
        description?: string | undefined;
        niveau?: string | undefined;
        dureeJours?: number | undefined;
        dureeHeures?: number | undefined;
        dateDebut?: string | undefined;
        dateFin?: string | undefined;
        lieu?: string | undefined;
        maxParticipants?: number | undefined;
        cout?: number | undefined;
        formateurId?: number | undefined;
        objectifs?: string | undefined;
        prerequis?: string | undefined;
        programme?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        type: "Interne" | "Externe" | "E_learning" | "Mixte" | "Certification";
        titre: string;
        domaine: "Autre" | "Informatique" | "Management" | "Communication" | "Finance" | "RH" | "Securite" | "Langue" | "Technique";
        description?: string | undefined;
        niveau?: string | undefined;
        dureeJours?: number | undefined;
        dureeHeures?: number | undefined;
        dateDebut?: string | undefined;
        dateFin?: string | undefined;
        lieu?: string | undefined;
        maxParticipants?: number | undefined;
        cout?: number | undefined;
        formateurId?: number | undefined;
        objectifs?: string | undefined;
        prerequis?: string | undefined;
        programme?: string | undefined;
    };
}, {
    body: {
        type: "Interne" | "Externe" | "E_learning" | "Mixte" | "Certification";
        titre: string;
        domaine: "Autre" | "Informatique" | "Management" | "Communication" | "Finance" | "RH" | "Securite" | "Langue" | "Technique";
        description?: string | undefined;
        niveau?: string | undefined;
        dureeJours?: number | undefined;
        dureeHeures?: number | undefined;
        dateDebut?: string | undefined;
        dateFin?: string | undefined;
        lieu?: string | undefined;
        maxParticipants?: number | undefined;
        cout?: number | undefined;
        formateurId?: number | undefined;
        objectifs?: string | undefined;
        prerequis?: string | undefined;
        programme?: string | undefined;
    };
}>;
export declare const idParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
}, {
    params: {
        id: string;
    };
}>;
export declare const validationStagiaireSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        action: z.ZodEnum<["accepter", "refuser"]>;
        commentaire: z.ZodOptional<z.ZodString>;
        tuteurId: z.ZodOptional<z.ZodNumber>;
        dateDebut: z.ZodOptional<z.ZodString>;
        dateFin: z.ZodOptional<z.ZodString>;
        sujet: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action: "accepter" | "refuser";
        tuteurId?: number | undefined;
        dateDebut?: string | undefined;
        dateFin?: string | undefined;
        commentaire?: string | undefined;
        sujet?: string | undefined;
    }, {
        action: "accepter" | "refuser";
        tuteurId?: number | undefined;
        dateDebut?: string | undefined;
        dateFin?: string | undefined;
        commentaire?: string | undefined;
        sujet?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        action: "accepter" | "refuser";
        tuteurId?: number | undefined;
        dateDebut?: string | undefined;
        dateFin?: string | undefined;
        commentaire?: string | undefined;
        sujet?: string | undefined;
    };
    params: {
        id: string;
    };
}, {
    body: {
        action: "accepter" | "refuser";
        tuteurId?: number | undefined;
        dateDebut?: string | undefined;
        dateFin?: string | undefined;
        commentaire?: string | undefined;
        sujet?: string | undefined;
    };
    params: {
        id: string;
    };
}>;
/** Automatisation workflow stage (un clic) */
export declare const stagiaireWorkflowAcceptSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        commentaire: z.ZodOptional<z.ZodString>;
        tuteurId: z.ZodOptional<z.ZodNumber>;
        dateDebut: z.ZodOptional<z.ZodString>;
        dateFin: z.ZodOptional<z.ZodString>;
        sujet: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tuteurId?: number | undefined;
        dateDebut?: string | undefined;
        dateFin?: string | undefined;
        commentaire?: string | undefined;
        sujet?: string | undefined;
    }, {
        tuteurId?: number | undefined;
        dateDebut?: string | undefined;
        dateFin?: string | undefined;
        commentaire?: string | undefined;
        sujet?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        tuteurId?: number | undefined;
        dateDebut?: string | undefined;
        dateFin?: string | undefined;
        commentaire?: string | undefined;
        sujet?: string | undefined;
    };
    params: {
        id: string;
    };
}, {
    body: {
        tuteurId?: number | undefined;
        dateDebut?: string | undefined;
        dateFin?: string | undefined;
        commentaire?: string | undefined;
        sujet?: string | undefined;
    };
    params: {
        id: string;
    };
}>;
export declare const stagiaireWorkflowAssignProjectSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        titre: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        departementId: z.ZodOptional<z.ZodNumber>;
        formateurId: z.ZodOptional<z.ZodNumber>;
        formationId: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        departementId?: number | undefined;
        description?: string | undefined;
        titre?: string | undefined;
        formateurId?: number | undefined;
        formationId?: number | undefined;
    }, {
        departementId?: number | undefined;
        description?: string | undefined;
        titre?: string | undefined;
        formateurId?: number | undefined;
        formationId?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        departementId?: number | undefined;
        description?: string | undefined;
        titre?: string | undefined;
        formateurId?: number | undefined;
        formationId?: number | undefined;
    };
    params: {
        id: string;
    };
}, {
    body: {
        departementId?: number | undefined;
        description?: string | undefined;
        titre?: string | undefined;
        formateurId?: number | undefined;
        formationId?: number | undefined;
    };
    params: {
        id: string;
    };
}>;
export declare const stagiaireWorkflowAssignFormateurSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        formateurId: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        formateurId: number;
    }, {
        formateurId: number;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        formateurId: number;
    };
    params: {
        id: string;
    };
}, {
    body: {
        formateurId: number;
    };
    params: {
        id: string;
    };
}>;
export declare const stagiaireWorkflowCloseSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        force: z.ZodOptional<z.ZodBoolean>;
        noteFinale: z.ZodOptional<z.ZodNumber>;
        evaluationFinale: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        evaluationFinale?: string | undefined;
        noteFinale?: number | undefined;
        force?: boolean | undefined;
    }, {
        evaluationFinale?: string | undefined;
        noteFinale?: number | undefined;
        force?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        evaluationFinale?: string | undefined;
        noteFinale?: number | undefined;
        force?: boolean | undefined;
    };
    params: {
        id: string;
    };
}, {
    body: {
        evaluationFinale?: string | undefined;
        noteFinale?: number | undefined;
        force?: boolean | undefined;
    };
    params: {
        id: string;
    };
}>;
export declare const stagiaireWorkflowSendScheduleSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        scheduleStartAt: z.ZodOptional<z.ZodString>;
        scheduleEndAt: z.ZodOptional<z.ZodString>;
        message: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        message?: string | undefined;
        scheduleStartAt?: string | undefined;
        scheduleEndAt?: string | undefined;
    }, {
        message?: string | undefined;
        scheduleStartAt?: string | undefined;
        scheduleEndAt?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        message?: string | undefined;
        scheduleStartAt?: string | undefined;
        scheduleEndAt?: string | undefined;
    };
    params: {
        id: string;
    };
}, {
    body: {
        message?: string | undefined;
        scheduleStartAt?: string | undefined;
        scheduleEndAt?: string | undefined;
    };
    params: {
        id: string;
    };
}>;
export declare const stagiaireWorkflowIdOnlySchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodOptional<z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body?: {} | undefined;
}, {
    params: {
        id: string;
    };
    body?: {} | undefined;
}>;
export declare const signatureConventionSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
}, {
    params: {
        id: string;
    };
}>;
export declare const inscriptionFormateurSchema: z.ZodObject<{
    body: z.ZodObject<{
        domainesCompetences: z.ZodArray<z.ZodString, "many">;
        disponibiliteHeures: z.ZodNumber;
        motivation: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        domainesCompetences: string[];
        disponibiliteHeures: number;
        motivation?: string | undefined;
    }, {
        domainesCompetences: string[];
        disponibiliteHeures: number;
        motivation?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        domainesCompetences: string[];
        disponibiliteHeures: number;
        motivation?: string | undefined;
    };
}, {
    body: {
        domainesCompetences: string[];
        disponibiliteHeures: number;
        motivation?: string | undefined;
    };
}>;
/** Création d’un compte formateur interne par Direction RH / Manager */
export declare const adminCreateFormateurInterneSchema: z.ZodObject<{
    body: z.ZodObject<{
        nom: z.ZodString;
        prenom: z.ZodString;
        email: z.ZodString;
        motDePasse: z.ZodString;
        departementId: z.ZodOptional<z.ZodNumber>;
        poste: z.ZodOptional<z.ZodString>;
        telephone: z.ZodOptional<z.ZodString>;
        domainesCompetences: z.ZodArray<z.ZodString, "many">;
        disponibiliteHeures: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        nom: string;
        prenom: string;
        email: string;
        motDePasse: string;
        domainesCompetences: string[];
        disponibiliteHeures: number;
        telephone?: string | undefined;
        poste?: string | undefined;
        departementId?: number | undefined;
    }, {
        nom: string;
        prenom: string;
        email: string;
        motDePasse: string;
        domainesCompetences: string[];
        disponibiliteHeures: number;
        telephone?: string | undefined;
        poste?: string | undefined;
        departementId?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        nom: string;
        prenom: string;
        email: string;
        motDePasse: string;
        domainesCompetences: string[];
        disponibiliteHeures: number;
        telephone?: string | undefined;
        poste?: string | undefined;
        departementId?: number | undefined;
    };
}, {
    body: {
        nom: string;
        prenom: string;
        email: string;
        motDePasse: string;
        domainesCompetences: string[];
        disponibiliteHeures: number;
        telephone?: string | undefined;
        poste?: string | undefined;
        departementId?: number | undefined;
    };
}>;
/** Mise à jour d’un formateur interne par Direction RH / Manager */
export declare const adminUpdateFormateurInterneSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        nom: z.ZodOptional<z.ZodString>;
        prenom: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        motDePasse: z.ZodOptional<z.ZodString>;
        departementId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        poste: z.ZodOptional<z.ZodString>;
        telephone: z.ZodOptional<z.ZodString>;
        domainesCompetences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        disponibiliteHeures: z.ZodOptional<z.ZodNumber>;
        isActif: z.ZodOptional<z.ZodBoolean>;
        isArchived: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        isActif?: boolean | undefined;
        isArchived?: boolean | undefined;
        nom?: string | undefined;
        prenom?: string | undefined;
        email?: string | undefined;
        motDePasse?: string | undefined;
        telephone?: string | undefined;
        poste?: string | undefined;
        departementId?: number | null | undefined;
        domainesCompetences?: string[] | undefined;
        disponibiliteHeures?: number | undefined;
    }, {
        isActif?: boolean | undefined;
        isArchived?: boolean | undefined;
        nom?: string | undefined;
        prenom?: string | undefined;
        email?: string | undefined;
        motDePasse?: string | undefined;
        telephone?: string | undefined;
        poste?: string | undefined;
        departementId?: number | null | undefined;
        domainesCompetences?: string[] | undefined;
        disponibiliteHeures?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        isActif?: boolean | undefined;
        isArchived?: boolean | undefined;
        nom?: string | undefined;
        prenom?: string | undefined;
        email?: string | undefined;
        motDePasse?: string | undefined;
        telephone?: string | undefined;
        poste?: string | undefined;
        departementId?: number | null | undefined;
        domainesCompetences?: string[] | undefined;
        disponibiliteHeures?: number | undefined;
    };
    params: {
        id: string;
    };
}, {
    body: {
        isActif?: boolean | undefined;
        isArchived?: boolean | undefined;
        nom?: string | undefined;
        prenom?: string | undefined;
        email?: string | undefined;
        motDePasse?: string | undefined;
        telephone?: string | undefined;
        poste?: string | undefined;
        departementId?: number | null | undefined;
        domainesCompetences?: string[] | undefined;
        disponibiliteHeures?: number | undefined;
    };
    params: {
        id: string;
    };
}>;
export declare const reponseOpportuniteSchema: z.ZodObject<{
    params: z.ZodObject<{
        demandeId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        demandeId: string;
    }, {
        demandeId: string;
    }>;
    body: z.ZodObject<{
        action: z.ZodEnum<["accepter", "refuser"]>;
        commentaire: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action: "accepter" | "refuser";
        commentaire?: string | undefined;
    }, {
        action: "accepter" | "refuser";
        commentaire?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        action: "accepter" | "refuser";
        commentaire?: string | undefined;
    };
    params: {
        demandeId: string;
    };
}, {
    body: {
        action: "accepter" | "refuser";
        commentaire?: string | undefined;
    };
    params: {
        demandeId: string;
    };
}>;
export declare const validationInscriptionSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        action: z.ZodEnum<["valider", "refuser"]>;
        commentaire: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        action: "refuser" | "valider";
        commentaire?: string | undefined;
    }, {
        action: "refuser" | "valider";
        commentaire?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        action: "refuser" | "valider";
        commentaire?: string | undefined;
    };
    params: {
        id: string;
    };
}, {
    body: {
        action: "refuser" | "valider";
        commentaire?: string | undefined;
    };
    params: {
        id: string;
    };
}>;
/** Accept / reject dédiés (corps optionnel : commentaire) */
export declare const inscriptionDecisionCommentSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        commentaire: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        commentaire?: string | undefined;
    }, {
        commentaire?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        commentaire?: string | undefined;
    };
    params: {
        id: string;
    };
}, {
    body: {
        commentaire?: string | undefined;
    };
    params: {
        id: string;
    };
}>;
/** Création d’employé / manager par la Direction RH */
export declare const createEmployeRhSchema: z.ZodObject<{
    body: z.ZodObject<{
        nom: z.ZodString;
        prenom: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        role: z.ZodEnum<["Manager", "Employe", "Formateur_Interne", "Formateur_Externe"]>;
        departementId: z.ZodNumber;
        poste: z.ZodOptional<z.ZodString>;
        telephone: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        nom: string;
        prenom: string;
        email: string;
        departementId: number;
        role: "Manager" | "Employe" | "Formateur_Interne" | "Formateur_Externe";
        password: string;
        telephone?: string | undefined;
        poste?: string | undefined;
    }, {
        nom: string;
        prenom: string;
        email: string;
        departementId: number;
        role: "Manager" | "Employe" | "Formateur_Interne" | "Formateur_Externe";
        password: string;
        telephone?: string | undefined;
        poste?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        nom: string;
        prenom: string;
        email: string;
        departementId: number;
        role: "Manager" | "Employe" | "Formateur_Interne" | "Formateur_Externe";
        password: string;
        telephone?: string | undefined;
        poste?: string | undefined;
    };
}, {
    body: {
        nom: string;
        prenom: string;
        email: string;
        departementId: number;
        role: "Manager" | "Employe" | "Formateur_Interne" | "Formateur_Externe";
        password: string;
        telephone?: string | undefined;
        poste?: string | undefined;
    };
}>;
export declare const updateEmployeRhSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodEffects<z.ZodObject<{
        nom: z.ZodOptional<z.ZodString>;
        prenom: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        poste: z.ZodOptional<z.ZodString>;
        telephone: z.ZodOptional<z.ZodString>;
        departementId: z.ZodOptional<z.ZodNumber>;
        password: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        nom?: string | undefined;
        prenom?: string | undefined;
        email?: string | undefined;
        telephone?: string | undefined;
        poste?: string | undefined;
        departementId?: number | undefined;
        password?: string | undefined;
    }, {
        nom?: string | undefined;
        prenom?: string | undefined;
        email?: string | undefined;
        telephone?: string | undefined;
        poste?: string | undefined;
        departementId?: number | undefined;
        password?: string | undefined;
    }>, {
        nom?: string | undefined;
        prenom?: string | undefined;
        email?: string | undefined;
        telephone?: string | undefined;
        poste?: string | undefined;
        departementId?: number | undefined;
        password?: string | undefined;
    }, {
        nom?: string | undefined;
        prenom?: string | undefined;
        email?: string | undefined;
        telephone?: string | undefined;
        poste?: string | undefined;
        departementId?: number | undefined;
        password?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        nom?: string | undefined;
        prenom?: string | undefined;
        email?: string | undefined;
        telephone?: string | undefined;
        poste?: string | undefined;
        departementId?: number | undefined;
        password?: string | undefined;
    };
    params: {
        id: string;
    };
}, {
    body: {
        nom?: string | undefined;
        prenom?: string | undefined;
        email?: string | undefined;
        telephone?: string | undefined;
        poste?: string | undefined;
        departementId?: number | undefined;
        password?: string | undefined;
    };
    params: {
        id: string;
    };
}>;
export declare const employeRhActifSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        isActif: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        isActif: boolean;
    }, {
        isActif: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        isActif: boolean;
    };
    params: {
        id: string;
    };
}, {
    body: {
        isActif: boolean;
    };
    params: {
        id: string;
    };
}>;
export declare const sendMessageSchema: z.ZodObject<{
    body: z.ZodObject<{
        recipientId: z.ZodNumber;
        body: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        recipientId: number;
        body: string;
    }, {
        recipientId: number;
        body: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        recipientId: number;
        body: string;
    };
}, {
    body: {
        recipientId: number;
        body: string;
    };
}>;
export declare const messageThreadParamsSchema: z.ZodObject<{
    params: z.ZodObject<{
        otherId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        otherId: string;
    }, {
        otherId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        otherId: string;
    };
}, {
    params: {
        otherId: string;
    };
}>;
export declare const createEmployeManagerSchema: z.ZodObject<{
    body: z.ZodObject<{
        nom: z.ZodString;
        prenom: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        role: z.ZodEnum<["Manager", "Employe", "Formateur_Interne", "Formateur_Externe"]>;
        poste: z.ZodOptional<z.ZodString>;
        telephone: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        nom: string;
        prenom: string;
        email: string;
        role: "Manager" | "Employe" | "Formateur_Interne" | "Formateur_Externe";
        password: string;
        telephone?: string | undefined;
        poste?: string | undefined;
    }, {
        nom: string;
        prenom: string;
        email: string;
        role: "Manager" | "Employe" | "Formateur_Interne" | "Formateur_Externe";
        password: string;
        telephone?: string | undefined;
        poste?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        nom: string;
        prenom: string;
        email: string;
        role: "Manager" | "Employe" | "Formateur_Interne" | "Formateur_Externe";
        password: string;
        telephone?: string | undefined;
        poste?: string | undefined;
    };
}, {
    body: {
        nom: string;
        prenom: string;
        email: string;
        role: "Manager" | "Employe" | "Formateur_Interne" | "Formateur_Externe";
        password: string;
        telephone?: string | undefined;
        poste?: string | undefined;
    };
}>;
export declare const employeArchiveSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
    body: z.ZodObject<{
        isArchived: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        isArchived: boolean;
    }, {
        isArchived: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        isArchived: boolean;
    };
    params: {
        id: string;
    };
}, {
    body: {
        isArchived: boolean;
    };
    params: {
        id: string;
    };
}>;
//# sourceMappingURL=validation.middleware.d.ts.map