import { Employe, Formation, DemandeFormateur } from '../models';
export declare class FormateurService {
    /**
     * Notifier les formateurs internes qualifiés d'une opportunité
     * Algorithme de matching : compare domaines formation ↔ compétences formateur
     */
    static notifierOpportunite(formationId: number): Promise<{
        notifEnvoyees: number;
        formateursQualifies: number;
    }>;
    /**
     * Calcule un score de compatibilité formateur ↔ formation (0-10)
     */
    static calculerScoreMatching(formateur: Employe, formation: Formation): number;
    /**
     * Formateur accepte ou refuse une opportunité
     */
    static repondreOpportunite(demandeId: number, formateurId: number, action: 'accepter' | 'refuser', commentaire?: string): Promise<{
        message: string;
        demande: DemandeFormateur;
        compensation?: undefined;
    } | {
        message: string;
        demande: DemandeFormateur;
        compensation: {
            prime: number;
            heures: number;
        };
    }>;
    /**
     * Attribuer des badges selon les performances
     */
    static attribuerBadges(formateurId: number): Promise<{
        badges: string[];
        nouveauxBadges: string[];
    } | undefined>;
    /**
     * Calculer la compensation pour un formateur
     */
    static calculerCompensation(formateurId: number, formation: Formation): Promise<{
        prime: number;
        heures: number;
    }>;
    static inscrireCommeFormateur(employeId: number, data: {
        domainesCompetences: string[];
        disponibiliteHeures: number;
        motivation?: string;
    }): Promise<Employe>;
    static getFormateursInternes(filtres?: Record<string, unknown>, user?: {
        role: string;
        departementId?: number | null;
    }): Promise<Employe[]>;
    static getFormateurInterneById(id: number): Promise<Employe>;
    static createFormateurInterne(data: {
        nom: string;
        prenom: string;
        email: string;
        motDePasse: string;
        departementId?: number;
        poste?: string;
        telephone?: string;
        domainesCompetences: string[];
        disponibiliteHeures: number;
    }): Promise<Employe>;
    static updateFormateurInterne(id: number, data: {
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
    }): Promise<Employe>;
    static getDashboardFormateur(formateurId: number): Promise<{
        profil: Employe;
        demandes: DemandeFormateur[];
        totalFormations: number;
        totalHeures: number;
        noteMoyenne: number;
        badges: any;
    }>;
}
//# sourceMappingURL=formateur.service.d.ts.map