import { Model, Optional } from 'sequelize';
export interface BudgetTrackerAttributes {
    id: number;
    departementId: number;
    annee: number;
    mois: number;
    budgetAlloue: number;
    budgetUtilise: number;
    budgetRestant: number;
    pourcentageUtilisation: number;
    alerteSent60: boolean;
    alerteSent80: boolean;
    alerteSent90: boolean;
    nbFormationsFinancees: number;
    details?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
interface BudgetTrackerCreationAttributes extends Optional<BudgetTrackerAttributes, 'id' | 'budgetUtilise' | 'budgetRestant' | 'pourcentageUtilisation' | 'alerteSent60' | 'alerteSent80' | 'alerteSent90' | 'nbFormationsFinancees'> {
}
declare class BudgetTracker extends Model<BudgetTrackerAttributes, BudgetTrackerCreationAttributes> implements BudgetTrackerAttributes {
    id: number;
    departementId: number;
    annee: number;
    mois: number;
    budgetAlloue: number;
    budgetUtilise: number;
    budgetRestant: number;
    pourcentageUtilisation: number;
    alerteSent60: boolean;
    alerteSent80: boolean;
    alerteSent90: boolean;
    nbFormationsFinancees: number;
    details?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default BudgetTracker;
//# sourceMappingURL=BudgetTracker.d.ts.map