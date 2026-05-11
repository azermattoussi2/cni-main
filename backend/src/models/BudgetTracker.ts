// ============================================
// Fichier : models/BudgetTracker.ts
// Description : Suivi mensuel détaillé du budget formations
// ============================================

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface BudgetTrackerAttributes {
  id: number;
  departementId: number;
  annee: number;
  mois: number; // 1-12
  budgetAlloue: number;
  budgetUtilise: number;
  budgetRestant: number;
  pourcentageUtilisation: number;
  alerteSent60: boolean;
  alerteSent80: boolean;
  alerteSent90: boolean;
  nbFormationsFinancees: number;
  details?: string; // JSON : liste des formations financées ce mois
  createdAt?: Date;
  updatedAt?: Date;
}

interface BudgetTrackerCreationAttributes
  extends Optional<
    BudgetTrackerAttributes,
    | 'id'
    | 'budgetUtilise'
    | 'budgetRestant'
    | 'pourcentageUtilisation'
    | 'alerteSent60'
    | 'alerteSent80'
    | 'alerteSent90'
    | 'nbFormationsFinancees'
  > {}

class BudgetTracker
  extends Model<BudgetTrackerAttributes, BudgetTrackerCreationAttributes>
  implements BudgetTrackerAttributes
{
  public id!: number;
  public departementId!: number;
  public annee!: number;
  public mois!: number;
  public budgetAlloue!: number;
  public budgetUtilise!: number;
  public budgetRestant!: number;
  public pourcentageUtilisation!: number;
  public alerteSent60!: boolean;
  public alerteSent80!: boolean;
  public alerteSent90!: boolean;
  public nbFormationsFinancees!: number;
  public details?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

BudgetTracker.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    departementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    annee: { type: DataTypes.INTEGER, allowNull: false },
    mois: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 12 } },
    budgetAlloue: { type: DataTypes.DECIMAL(12, 3), allowNull: false },
    budgetUtilise: { type: DataTypes.DECIMAL(12, 3), defaultValue: 0 },
    budgetRestant: { type: DataTypes.DECIMAL(12, 3), defaultValue: 0 },
    pourcentageUtilisation: { type: DataTypes.FLOAT, defaultValue: 0 },
    alerteSent60: { type: DataTypes.BOOLEAN, defaultValue: false },
    alerteSent80: { type: DataTypes.BOOLEAN, defaultValue: false },
    alerteSent90: { type: DataTypes.BOOLEAN, defaultValue: false },
    nbFormationsFinancees: { type: DataTypes.INTEGER, defaultValue: 0 },
    details: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: 'budget_tracker',
    modelName: 'BudgetTracker',
    indexes: [{ unique: true, fields: ['departementId', 'annee', 'mois'] }],
  }
);

export default BudgetTracker;
