import { Employe } from '../models';
import type { RoleType } from '../models/Employe';
export declare class EmployeManagerService {
    private static assertManagerScope;
    static createEmploye(managerId: number, data: {
        nom: string;
        prenom: string;
        email: string;
        password: string;
        role: RoleType;
        poste?: string;
        telephone?: string;
    }): Promise<Employe | null>;
    static updateEmploye(managerId: number, targetId: number, data: Partial<{
        nom: string;
        prenom: string;
        email: string;
        poste: string;
        telephone: string;
        motDePasse: string;
        departementId: number;
    }>): Promise<Employe | null>;
    static setActif(managerId: number, targetId: number, isActif: boolean): Promise<{
        id: number;
        isActif: boolean;
    }>;
    static setArchived(managerId: number, targetId: number, isArchived: boolean): Promise<{
        id: number;
        isArchived: boolean;
    }>;
}
//# sourceMappingURL=employeManager.service.d.ts.map