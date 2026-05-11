// ============================================
// Fichier : models/InscriptionFormation.ts
// Description : Table de liaison Employé-Formation avec workflow validation
// ============================================

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type StatutInscription =
  | 'En_attente_manager'
  | 'En_attente_RH'
  | 'Validee'
  | 'Refusee'
  | 'Liste_attente'
  | 'Annulee'
  | 'Terminee';

export interface InscriptionFormationAttributes {
  id: number;
  employeId: number;
  formationId: number;
  statut: StatutInscription;
  // Workflow validation
  dateDemandeEmploye: Date;
  dateValidationManager?: Date;
  dateValidationRH?: Date;
  managerId?: number;
  commentaireManager?: string;
  commentaireRH?: string;
  commentaireRefus?: string;
  // Présence et résultat
  tauxPresence?: number; // pourcentage
  noteSatisfaction?: number; // /5
  commentaireSatisfaction?: string;
  certificationObtenue: boolean;
  certificatPath?: string;
  dateEnvoiCertificat?: Date;
  // Budget
  coutReel?: number;
  budgetDepartementImpacte: boolean;
  // Rappels
  rappelJ7Envoye: boolean;
  rappelJ2Envoye: boolean;
  rappelJ1Envoye: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface InscriptionCreationAttributes
  extends Optional<
    InscriptionFormationAttributes,
    | 'id'
    | 'statut'
    | 'dateDemandeEmploye'
    | 'certificationObtenue'
    | 'budgetDepartementImpacte'
    | 'rappelJ7Envoye'
    | 'rappelJ2Envoye'
    | 'rappelJ1Envoye'
  > {}

class InscriptionFormation
  extends Model<InscriptionFormationAttributes, InscriptionCreationAttributes>
  implements InscriptionFormationAttributes
{
  public id!: number;
  public employeId!: number;
  public formationId!: number;
  public statut!: StatutInscription;
  public dateDemandeEmploye!: Date;
  public dateValidationManager?: Date;
  public dateValidationRH?: Date;
  public managerId?: number;
  public commentaireManager?: string;
  public commentaireRH?: string;
  public commentaireRefus?: string;
  public tauxPresence?: number;
  public noteSatisfaction?: number;
  public commentaireSatisfaction?: string;
  public certificationObtenue!: boolean;
  public certificatPath?: string;
  public dateEnvoiCertificat?: Date;
  public coutReel?: number;
  public budgetDepartementImpacte!: boolean;
  public rappelJ7Envoye!: boolean;
  public rappelJ2Envoye!: boolean;
  public rappelJ1Envoye!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InscriptionFormation.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    employeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    formationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    statut: {
      type: DataTypes.ENUM(
        'En_attente_manager','En_attente_RH','Validee','Refusee',
        'Liste_attente','Annulee','Terminee'
      ),
      defaultValue: 'En_attente_manager',
    },
    dateDemandeEmploye: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    dateValidationManager: { type: DataTypes.DATE, allowNull: true },
    dateValidationRH: { type: DataTypes.DATE, allowNull: true },
    managerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    commentaireManager: { type: DataTypes.TEXT, allowNull: true },
    commentaireRH: { type: DataTypes.TEXT, allowNull: true },
    commentaireRefus: { type: DataTypes.TEXT, allowNull: true },
    tauxPresence: { type: DataTypes.FLOAT, allowNull: true },
    noteSatisfaction: { type: DataTypes.FLOAT, allowNull: true },
    commentaireSatisfaction: { type: DataTypes.TEXT, allowNull: true },
    certificationObtenue: { type: DataTypes.BOOLEAN, defaultValue: false },
    certificatPath: { type: DataTypes.STRING(500), allowNull: true },
    dateEnvoiCertificat: { type: DataTypes.DATE, allowNull: true },
    coutReel: { type: DataTypes.DECIMAL(12, 3), allowNull: true },
    budgetDepartementImpacte: { type: DataTypes.BOOLEAN, defaultValue: false },
    rappelJ7Envoye: { type: DataTypes.BOOLEAN, defaultValue: false },
    rappelJ2Envoye: { type: DataTypes.BOOLEAN, defaultValue: false },
    rappelJ1Envoye: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    tableName: 'inscriptions_formations',
    modelName: 'InscriptionFormation',
    indexes: [{ unique: true, fields: ['employeId', 'formationId'] }],
  }
);

export default InscriptionFormation;
