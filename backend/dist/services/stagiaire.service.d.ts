import { Stagiaire } from '../models';
import { JwtPayload } from '../config/jwt';
export declare class StagiaireService {
    private static syncFinishedStagesByDate;
    /**
     * Soumettre une nouvelle candidature de stage
     * - Crée la fiche candidat
     * - Envoie email confirmation au candidat
     * - Notifie RH et responsable département
     */
    static soumettreCandidature(data: Record<string, unknown>, files?: Record<string, unknown>, options?: {
        skipOtpVerification?: boolean;
        skipCvRequirement?: boolean;
    }): Promise<Stagiaire>;
    /**
     * Validation RH (première étape)
     */
    static validerRH(stagiaireId: number, action: 'accepter' | 'refuser', commentaire?: string): Promise<{
        message: string;
        stagiaire: Stagiaire;
    }>;
    /**
     * Validation Manager (deuxième étape → acceptation finale)
     */
    static validerManager(stagiaireId: number, managerId: number, action: 'accepter' | 'refuser', data?: {
        tuteurId?: number;
        dateDebut?: string;
        dateFin?: string;
        sujet?: string;
        commentaire?: string;
    }): Promise<{
        message: string;
        stagiaire: Stagiaire;
    }>;
    /**
     * Signature électronique de la convention (simulée)
     */
    static signerConvention(stagiaireId: number, actor: JwtPayload): Promise<{
        message: string;
        stagiaire: Stagiaire;
    }>;
    /**
     * Envoyer les rappels automatiques (J-7, mi-parcours, J-14 avant fin)
     * À appeler quotidiennement via un cron job
     */
    static envoyerRappels(): Promise<{
        rappelsEnvoyes: number;
    }>;
    static getAll(filters?: Record<string, unknown>, viewer?: JwtPayload | null): Promise<Stagiaire[]>;
    static getById(id: number, viewer?: JwtPayload | null): Promise<Stagiaire>;
    static update(id: number, data: Record<string, unknown>): Promise<Stagiaire>;
}
//# sourceMappingURL=stagiaire.service.d.ts.map