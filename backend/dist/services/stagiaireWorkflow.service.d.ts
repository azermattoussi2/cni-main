import { Stagiaire } from '../models';
import { JwtPayload } from '../config/jwt';
export declare class StagiaireWorkflowService {
    static reanalyzeCv(user: JwtPayload, id: number): Promise<{
        message: string;
        stagiaire: Stagiaire;
    }>;
    private static resolveEncadreur;
    /** RH : En_attente → En_examen. Manager : En_examen → Accepte (+ convention). */
    static accept(user: JwtPayload, id: number, body: {
        commentaire?: string;
        tuteurId?: number;
        dateDebut?: string;
        dateFin?: string;
        sujet?: string;
    }): Promise<{
        message: string;
        stagiaire: Stagiaire;
    }>;
    static assignProject(user: JwtPayload, id: number, body: {
        titre?: string;
        description?: string;
        departementId?: number;
        formateurId?: number;
        formationId?: number;
    }): Promise<{
        message: string;
        stagiaire: Stagiaire;
    }>;
    static assignFormateur(user: JwtPayload, id: number, body: {
        formateurId: number;
    }): Promise<{
        message: string;
        stagiaire: Stagiaire;
    }>;
    static sendSchedule(user: JwtPayload, id: number, body?: {
        scheduleStartAt?: string;
        scheduleEndAt?: string;
        message?: string;
    }): Promise<{
        message: string;
        stagiaire: Stagiaire;
    }>;
    static generateAttestation(user: JwtPayload, id: number): Promise<{
        message: string;
        stagiaire: Stagiaire;
    }>;
    static uploadAttestation(user: JwtPayload, id: number, filePath?: string): Promise<{
        message: string;
        stagiaire: Stagiaire;
    }>;
    static closeStage(user: JwtPayload, id: number, body: {
        force?: boolean;
        noteFinale?: number;
        evaluationFinale?: string;
    }): Promise<{
        message: string;
        stagiaire: Stagiaire;
    }>;
    static sendAttestation(user: JwtPayload, id: number): Promise<{
        message: string;
        stagiaire: Stagiaire;
    }>;
}
//# sourceMappingURL=stagiaireWorkflow.service.d.ts.map