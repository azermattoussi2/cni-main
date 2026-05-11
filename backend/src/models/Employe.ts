// ============================================
// Fichier : models/Employe.ts
// Description : Modèle Sequelize pour les employés CNI
// Rôles : Direction_RH, Manager, Employe, Formateur_Interne
// ============================================

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import bcrypt from 'bcryptjs';

export type RoleType =
  | 'Direction_RH'
  | 'Manager'
  | 'Employe'
  | 'Formateur_Interne'
  | 'Formateur_Externe'
  | 'Stagiaire';

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
  // Champs formateur interne
  estFormateur: boolean;
  domainesCompetences?: string; // JSON stringifié
  disponibiliteHeures?: number;
  totalHeuresFormation?: number;
  noteFormateur?: number;
  badges?: string; // JSON stringifié
  createdAt?: Date;
  updatedAt?: Date;
}

interface EmployeCreationAttributes
  extends Optional<EmployeAttributes, 'id' | 'isActif' | 'isArchived' | 'estFormateur'> {}

class Employe extends Model<EmployeAttributes, EmployeCreationAttributes>
  implements EmployeAttributes {
  public id!: number;
  public nom!: string;
  public prenom!: string;
  public email!: string;
  public motDePasse!: string;
  public telephone?: string;
  public poste?: string;
  public departementId?: number;
  public role!: RoleType;
  public matricule?: string;
  public dateEntree?: Date;
  public isActif!: boolean;
  public isArchived!: boolean;
  public refreshToken?: string;
  public avatar?: string;
  public estFormateur!: boolean;
  public domainesCompetences?: string;
  public disponibiliteHeures?: number;
  public totalHeuresFormation?: number;
  public noteFormateur?: number;
  public badges?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Méthode pour comparer les mots de passe
  public async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.motDePasse);
  }

  // Retourner l'objet sans le mot de passe
  public toSafeObject() {
    const obj = this.toJSON() as Partial<EmployeAttributes>;
    delete obj.motDePasse;
    delete obj.refreshToken;
    return obj;
  }
}

Employe.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    prenom: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    motDePasse: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    telephone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    poste: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    departementId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM(
        'Direction_RH',
        'Manager',
        'Employe',
        'Formateur_Interne',
        'Formateur_Externe',
        'Stagiaire'
      ),
      allowNull: false,
      defaultValue: 'Employe',
    },
    matricule: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
    dateEntree: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    isActif: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isArchived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    estFormateur: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    domainesCompetences: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON: ["JavaScript", "React", ...]',
    },
    disponibiliteHeures: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    totalHeuresFormation: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    noteFormateur: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    badges: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON: ["Expert", "100h", ...]',
    },
  },
  {
    sequelize,
    tableName: 'employes',
    modelName: 'Employe',
    hooks: {
      // Hasher le mot de passe avant création/modification
      beforeCreate: async (employe: Employe) => {
        if (employe.motDePasse) {
          employe.motDePasse = await bcrypt.hash(employe.motDePasse, 12);
        }
      },
      beforeUpdate: async (employe: Employe) => {
        if (employe.changed('motDePasse')) {
          employe.motDePasse = await bcrypt.hash(employe.motDePasse, 12);
        }
      },
    },
  }
);

export default Employe;
