import { Stagiaire, Formation, Employe, InscriptionFormation, Departement } from '../models';
export declare class ReportingService {
    private static syncFinishedStagesByDate;
    /** Inscriptions prises en compte dans « Mon calendrier » (demande acceptée côté métier). */
    private static readonly CALENDAR_INSCRIPTION_STATUTS;
    /** Formations suivies en tant que participant (inscription confirmée ou liste d’attente / terminée). */
    private static formationIdsCalendarParticipant;
    /**
     * @param scope global = vue organisation (toutes formations + stages) ; mine = périmètre personnel selon le rôle
     */
    static getCalendarEvents(userId: number, role: string, scope?: 'global' | 'mine'): Promise<({
        id: string;
        title: string;
        start: Date | undefined;
        end: Date | undefined;
        type: string;
        statut: import("../models/Formation").StatutFormation;
        location: string | undefined;
    } | {
        id: string;
        title: string;
        start: Date | undefined;
        end: Date | undefined;
        type: string;
        statut: import("../models/Stagiaire").StatutStage;
    })[]>;
    /**
     * Dashboard Direction / RH - Vue globale
     */
    static getDashboardRH(): Promise<{
        stages: {
            total: number;
            enCours: number;
            enAttente: number;
            acceptes: number;
            refuses: number;
            duMois: number;
            tauxAcceptation: number;
        };
        formations: {
            total: number;
            duMois: number;
            totalInscrits: number;
            enCours: number;
            satisfactionMoyenne: string | null;
        };
        budget: {
            total: number;
            utilise: number;
            restant: number;
            pourcentage: number;
            parDepartement: Departement[];
            alertes: Departement[];
        };
        formateurs: {
            internes: number;
        };
        graphiques: {
            candidaturesParMois: Stagiaire[];
            topFormations: InscriptionFormation[];
        };
    }>;
    /**
     * Dashboard Manager - Vue département
     */
    static getDashboardManager(managerId: number): Promise<{
        message: string;
        data: null;
        departement?: undefined;
        demandesEnAttente?: undefined;
        budget?: undefined;
        equipe?: undefined;
        formations?: undefined;
    } | {
        departement: Departement;
        demandesEnAttente: number;
        budget: {
            alloue: number;
            utilise: number;
            restant: number;
            pourcentage: number;
        };
        equipe: {
            total: number;
            formateurs: number;
            liste: Employe[];
        };
        formations: InscriptionFormation[];
        message?: undefined;
        data?: undefined;
    }>;
    /**
     * Dashboard Employé - Vue personnelle
     */
    static getDashboardEmploye(employeId: number): Promise<{
        profil: Employe;
        stats: {
            totalFormations: number;
            enCours: number;
            certificats: number;
            heuresFormation: number;
        };
        formationsAVenir: InscriptionFormation[];
        certifications: InscriptionFormation[];
        catalogue: Formation[];
        estFormateur: boolean;
        badges: any;
    }>;
    /**
     * Dashboard Tuteur de stage
     */
    static getDashboardTuteur(tuteurId: number): Promise<{
        stagiairesSuivis: Stagiaire[];
        total: number;
        evaluationsEnAttente: number;
    }>;
    /**
     * Rapport hebdomadaire (Workflow 16)
     */
    static genererRapportHebdomadaire(): Promise<{
        periode: string;
        stages: {
            nouvelles: number;
            acceptees: number;
        };
        formations: {
            nouvelles: number;
            inscriptions: number;
        };
    }>;
}
//# sourceMappingURL=reporting.service.d.ts.map