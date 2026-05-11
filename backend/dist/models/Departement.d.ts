import { Model, Optional } from 'sequelize';
export interface DepartementAttributes {
    id: number;
    nom: string;
    code: string;
    responsableId?: number | null;
    budgetFormationAnnuel: number;
    budgetUtilise: number;
    budgetRestant: number;
    effectif?: number;
    description?: string;
    isActif: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
interface DepartementCreationAttributes extends Optional<DepartementAttributes, 'id' | 'budgetUtilise' | 'budgetRestant' | 'isActif'> {
}
declare class Departement extends Model<DepartementAttributes, DepartementCreationAttributes> implements DepartementAttributes {
    id: number;
    nom: string;
    code: string;
    responsableId?: number | null;
    budgetFormationAnnuel: number;
    budgetUtilise: number;
    budgetRestant: number;
    effectif?: number;
    description?: string;
    isActif: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default Departement;
//# sourceMappingURL=Departement.d.ts.map