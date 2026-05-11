import { Model, Optional } from 'sequelize';
export type RoleType = 'Direction_RH' | 'Manager' | 'Employe' | 'Formateur_Interne' | 'Formateur_Externe' | 'Stagiaire';
export interface EmployeAttributes {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    motDePasse: string;
    telephone?: string;
    poste?: string;
    departementId?: number;
    role: RoleType;
    matricule?: string;
    dateEntree?: Date;
    isActif: boolean;
    /** Masqué des listes « actives » ; dossier conservé */
    isArchived?: boolean;
    refreshToken?: string;
    avatar?: string;
    estFormateur: boolean;
    domainesCompetences?: string;
    disponibiliteHeures?: number;
    totalHeuresFormation?: number;
    noteFormateur?: number;
    badges?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
interface EmployeCreationAttributes extends Optional<EmployeAttributes, 'id' | 'isActif' | 'isArchived' | 'estFormateur'> {
}
declare class Employe extends Model<EmployeAttributes, EmployeCreationAttributes> implements EmployeAttributes {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    motDePasse: string;
    telephone?: string;
    poste?: string;
    departementId?: number;
    role: RoleType;
    matricule?: string;
    dateEntree?: Date;
    isActif: boolean;
    isArchived: boolean;
    refreshToken?: string;
    avatar?: string;
    estFormateur: boolean;
    domainesCompetences?: string;
    disponibiliteHeures?: number;
    totalHeuresFormation?: number;
    noteFormateur?: number;
    badges?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    comparePassword(password: string): Promise<boolean>;
    toSafeObject(): Partial<EmployeAttributes>;
}
export default Employe;
//# sourceMappingURL=Employe.d.ts.map