// ============================================
// Fichier : models/Departement.ts
// Description : Modèle Sequelize pour les départements CNI
// ============================================

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

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

interface DepartementCreationAttributes
  extends Optional<DepartementAttributes, 'id' | 'budgetUtilise' | 'budgetRestant' | 'isActif'> {}

class Departement
  extends Model<DepartementAttributes, DepartementCreationAttributes>
  implements DepartementAttributes
{
  public id!: number;
  public nom!: string;
  public code!: string;
  public responsableId?: number | null;
  public budgetFormationAnnuel!: number;
  public budgetUtilise!: number;
  public budgetRestant!: number;
  public effectif?: number;
  public description?: string;
  public isActif!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Departement.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    nom: { type: DataTypes.STRING(150), allowNull: false },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    responsableId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    budgetFormationAnnuel: {
      type: DataTypes.DECIMAL(12, 3),
      defaultValue: 0,
      comment: 'Budget annuel en TND',
    },
    budgetUtilise: { type: DataTypes.DECIMAL(12, 3), defaultValue: 0 },
    budgetRestant: { type: DataTypes.DECIMAL(12, 3), defaultValue: 0 },
    effectif: { type: DataTypes.INTEGER, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    isActif: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'departements',
    modelName: 'Departement',
    hooks: {
      beforeSave: (dept: Departement) => {
        // Recalculer le budget restant automatiquement
        dept.budgetRestant =
          Number(dept.budgetFormationAnnuel) - Number(dept.budgetUtilise);
      },
    },
  }
);

export default Departement;
