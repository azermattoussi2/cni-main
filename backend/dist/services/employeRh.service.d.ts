import { Employe } from '../models';
import type { RoleType } from '../models/Employe';
export declare class EmployeRhService {
    static createEmploye(data: {
        nom: string;
        prenom: string;
        email: string;
        password: string;
        role: RoleType;
        departementId?: number;
        poste?: string;
        telephone?: string;
    }): Promise<Employe | null>;
    static updateEmploye(id: number, data: Partial<{
        nom: string;
        prenom: string;
        email: string;
        poste: string;
        telephone: string;
        departementId: number;
        motDePasse: string;
    }>): Promise<Employe | null>;
    static setActif(id: number, isActif: boolean): Promise<{
        id: number;
        isActif: boolean;
    }>;
    static setArchived(id: number, isArchived: boolean): Promise<{
        id: number;
        isArchived: boolean;
    }>;
}
//# sourceMappingURL=employeRh.service.d.ts.map