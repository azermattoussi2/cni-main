// ============================================
// Fichier : models/Formation.ts
// Description : Modèle Sequelize pour les formations (25+ champs)
// Conforme au cahier des charges section 6
// ============================================

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type StatutFormation =
  | 'Brouillon'
  | 'Publiee'
  | 'En_cours'
  | 'Terminee'
  | 'Annulee'
  | 'Archivee';

export type TypeFormation =
  | 'Interne'
  | 'Externe'
  | 'E_learning'
  | 'Mixte'
  | 'Certification';

export type DomaineFormation =
  | 'Informatique'
  | 'Management'
  | 'Communication'
  | 'Finance'
  | 'RH'
  | 'Securite'
  | 'Langue'
  | 'Technique'
  | 'Autre';

export interface FormationAttributes {
  id: number;
  titre: string;
  description?: string;
  domaine: DomaineFormation;
  type: TypeFormation;
  niveau?: string; // Débutant, Intermédiaire, Avancé
  dureeJours?: number;
  dureeHeures?: number;
  dateDebut?: Date;
  dateFin?: Date;
  lieu?: string;
  maxParticipants?: number;
  minParticipants?: number;
  nbInscrits: number;
  // Budget
  cout?: number; // coût total en TND
  coutParParticipant?: number;
  budgetDepartementId?: number;
  // Formateur
  formateurId?: number;
  formateurNom?: string; // pour formateurs externes
  // Statut et workflow
  statut: StatutFormation;
  // Évaluations
  noteSatisfaction?: number;
  nbEvaluations?: number;
  // Documents
  supportPath?: string;
  certificatTemplate?: string;
  // Autres
  objectifs?: string;
  prerequis?: string;
  programme?: string;
  lienVisio?: string;
  rappelJm7Envoye: boolean;
  rappelJm2Envoye: boolean;
  questionnaireSatisfactionEnvoye: boolean;
  isActif: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FormationCreationAttributes
  extends Optional<FormationAttributes, 'id' | 'nbInscrits' | 'statut' | 'rappelJm7Envoye' | 'rappelJm2Envoye' | 'questionnaireSatisfactionEnvoye' | 'isActif'> {}

class Formation
  extends Model<FormationAttributes, FormationCreationAttributes>
  implements FormationAttributes
{
  public id!: number;
  public titre!: string;
  public description?: string;
  public domaine!: DomaineFormation;
  public type!: TypeFormation;
  public niveau?: string;
  public dureeJours?: number;
  public dureeHeures?: number;
  public dateDebut?: Date;
  public dateFin?: Date;
  public lieu?: string;
  public maxParticipants?: number;
  public minParticipants?: number;
  public nbInscrits!: number;
  public cout?: number;
  public coutParParticipant?: number;
  public budgetDepartementId?: number;
  public formateurId?: number;
  public formateurNom?: string;
  public statut!: StatutFormation;
  public noteSatisfaction?: number;
  public nbEvaluations?: number;
  public supportPath?: string;
  public certificatTemplate?: string;
  public objectifs?: string;
  public prerequis?: string;
  public programme?: string;
  public lienVisio?: string;
  public rappelJm7Envoye!: boolean;
  public rappelJm2Envoye!: boolean;
  public questionnaireSatisfactionEnvoye!: boolean;
  public isActif!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Formation.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    titre: { type: DataTypes.STRING(300), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    domaine: {
      type: DataTypes.ENUM('Informatique','Management','Communication','Finance','RH','Securite','Langue','Technique','Autre'),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('Interne','Externe','E_learning','Mixte','Certification'),
      allowNull: false,
    },
    niveau: { type: DataTypes.STRING(50), allowNull: true },
    dureeJours: { type: DataTypes.INTEGER, allowNull: true },
    dureeHeures: { type: DataTypes.INTEGER, allowNull: true },
    dateDebut: { type: DataTypes.DATE, allowNull: true },
    dateFin: { type: DataTypes.DATE, allowNull: true },
    lieu: { type: DataTypes.STRING(200), allowNull: true },
    maxParticipants: { type: DataTypes.INTEGER, allowNull: true },
    minParticipants: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
    nbInscrits: { type: DataTypes.INTEGER, defaultValue: 0 },
    cout: { type: DataTypes.DECIMAL(12, 3), allowNull: true },
    coutParParticipant: { type: DataTypes.DECIMAL(12, 3), allowNull: true },
    budgetDepartementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    formateurId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    formateurNom: { type: DataTypes.STRING(200), allowNull: true },
    statut: {
      type: DataTypes.ENUM('Brouillon','Publiee','En_cours','Terminee','Annulee','Archivee'),
      defaultValue: 'Brouillon',
    },
    noteSatisfaction: { type: DataTypes.FLOAT, allowNull: true },
    nbEvaluations: { type: DataTypes.INTEGER, defaultValue: 0 },
    supportPath: { type: DataTypes.STRING(500), allowNull: true },
    certificatTemplate: { type: DataTypes.STRING(500), allowNull: true },
    objectifs: { type: DataTypes.TEXT, allowNull: true },
    prerequis: { type: DataTypes.TEXT, allowNull: true },
    programme: { type: DataTypes.TEXT, allowNull: true },
    lienVisio: { type: DataTypes.STRING(500), allowNull: true },
    rappelJm7Envoye: { type: DataTypes.BOOLEAN, defaultValue: false },
    rappelJm2Envoye: { type: DataTypes.BOOLEAN, defaultValue: false },
    questionnaireSatisfactionEnvoye: { type: DataTypes.BOOLEAN, defaultValue: false },
    isActif: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'formations',
    modelName: 'Formation',
  }
);

export default Formation;
