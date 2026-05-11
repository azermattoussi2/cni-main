export declare class AuthService {
    /**
     * Connexion d'un employé (tous rôles sauf Stagiaire)
     */
    static loginEmploye(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: Partial<import("../models/Employe").EmployeAttributes>;
    }>;
    /**
     * Inscription d'un nouvel utilisateur
     */
    static register(data: {
        nom: string;
        prenom: string;
        email: string;
        password: string;
        role?: 'Employe' | 'Formateur_Interne' | 'Formateur_Externe';
        departementId: number;
        telephone?: string;
        poste?: string;
        otpVerificationToken?: string;
    }): Promise<{
        pending: boolean;
        message: string;
    }>;
    /**
     * Renouveler l'access token via refresh token
     */
    static refreshToken(token: string): Promise<import("../config/jwt").TokenPair>;
    /**
     * Déconnexion (invalider le refresh token)
     */
    static logout(userId: number, role: string): Promise<void>;
    /**
     * Profil complet pour /auth/me (hors JWT : estFormateur, badges, etc.)
     */
    static getMeFull(userId: number, role: string): Promise<Partial<import("../models/Employe").EmployeAttributes> | {
        role: string;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map