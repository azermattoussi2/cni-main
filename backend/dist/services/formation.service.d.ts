import { Formation, InscriptionFormation } from '../models';
export declare class FormationService {
    static getPublicCatalog(): Promise<Formation[]>;
    /**
     * Créer une demande d'inscription à une formation
     * Vérifie : budget département, places disponibles, doublons
     */
    static demanderInscription(employeId: number, formationId: number): Promise<{
        message: string;
        inscription: InscriptionFormation;
    }>;
    /**
     * Validation Manager → RH
     */
    static validerManager(inscriptionId: number, managerId: number, action: 'valider' | 'refuser', commentaire?: string): Promise<{
        message: string;
        inscription: InscriptionFormation;
    }>;
    /**
     * Lorsqu’un formateur externe est accepté (place confirmée ou liste d’attente), refuser les autres
     * demandes de formateurs externes pour la même formation (statuts encore chez manager ou RH).
     */
    private static refuserAutresFormateursExternesPourFormation;
    /**
     * Validation finale RH → inscription confirmée
     */
    static validerRH(inscriptionId: number, action: 'valider' | 'refuser', commentaire?: string): Promise<{
        message: string;
        inscription: InscriptionFormation;
    }>;
    /**
     * Acceptation ou refus d’une inscription (manager si En_attente_manager, RH si En_attente_RH).
     * Alias métier pour les API « accept » / « reject ».
     */
    static decisionInscription(inscriptionId: number, actorId: number, actorRole: string, decision: 'accept' | 'reject', commentaire?: string): Promise<{
        message: string;
        inscription: InscriptionFormation;
    }>;
    /**
     * File d’attente validation : manager (département) ou RH (étape RH).
     */
    static listInscriptionsEnAttente(actorEmployeId: number, role: string): Promise<InscriptionFormation[]>;
    /**
     * Vérifier les budgets et envoyer des alertes à 60%, 80%, 90%
     */
    static verifierBudgets(): Promise<{
        alertesEnvoyees: number;
    }>;
    /**
     * Impacter le budget d'un département suite à une inscription
     */
    static impacterBudget(departementId: number, montant: number): Promise<void>;
    static envoyerRappels(): Promise<{
        rappelsEnvoyes: number;
    }>;
    static genererCertificat(inscriptionId: number): Promise<{
        message: string;
        certificatPath: string;
    }>;
    static getAll(filters?: any, options?: {
        employeId?: number;
    }): Promise<Formation[] | {
        monInscription: {
            id: number;
            statut: string;
        } | null;
    }[]>;
    static getById(id: number, options?: {
        employeId?: number;
    }): Promise<Formation | {
        monInscription: {
            id: number;
            statut: import("../models/InscriptionFormation").StatutInscription;
        } | null;
    }>;
    static create(data: any): Promise<Formation>;
    static update(id: number, data: any): Promise<Formation>;
    static publier(id: number): Promise<Formation>;
}
//# sourceMappingURL=formation.service.d.ts.map