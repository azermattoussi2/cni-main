// ============================================
// Fichier : models/Formateur.ts
// Description : Modèle Sequelize pour les formateurs externes
// ============================================

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface FormateurExterneAttributes {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  societe?: string;
  specialites?: string; // JSON
  cv?: string;
  tarifJournalier?: number;
  tarifHoraire?: number;
  disponible: boolean;
  note?: number;
  nbFormations: number;
  historiqueFormations?: string; // JSON
  contratPath?: string;
  rib?: string;
  isActif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FormateurExterneCreationAttributes
  extends Optional<FormateurExterneAttributes, 'id' | 'disponible' | 'nbFormations' | 'isActif'> {}

class FormateurExterne
  extends Model<FormateurExterneAttributes, FormateurExterneCreationAttributes>
  implements FormateurExterneAttributes
{
  public id!: number;
  public nom!: string;
  public prenom!: string;
  public email!: string;
  public telephone?: string;
  public societe?: string;
  public specialites?: string;
  public cv?: string;
  public tarifJournalier?: number;
  public tarifHoraire?: number;
  public disponible!: boolean;
  public note?: number;
  public nbFormations!: number;
  public historiqueFormations?: string;
  public contratPath?: string;
  public rib?: string;
  public isActif!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

FormateurExterne.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    nom: { type: DataTypes.STRING(100), allowNull: false },
    prenom: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
    telephone: { type: DataTypes.STRING(20), allowNull: true },
    societe: { type: DataTypes.STRING(200), allowNull: true },
    specialites: { type: DataTypes.TEXT, allowNull: true },
    cv: { type: DataTypes.STRING(500), allowNull: true },
    tarifJournalier: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
    tarifHoraire: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
    disponible: { type: DataTypes.BOOLEAN, defaultValue: true },
    note: { type: DataTypes.FLOAT, allowNull: true },
    nbFormations: { type: DataTypes.INTEGER, defaultValue: 0 },
    historiqueFormations: { type: DataTypes.TEXT, allowNull: true },
    contratPath: { type: DataTypes.STRING(500), allowNull: true },
    rib: { type: DataTypes.STRING(30), allowNull: true },
    isActif: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, tableName: 'formateurs_externes', modelName: 'FormateurExterne' }
);

export default FormateurExterne;
