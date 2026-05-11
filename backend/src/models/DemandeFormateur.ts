// ============================================
// Fichier : models/DemandeFormateur.ts
// Description : Suivi des sollicitations formateurs internes
// ============================================

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type StatutDemande = 'En_attente' | 'Acceptee' | 'Refusee' | 'Expiree';

export interface DemandeFormateurAttributes {
  id: number;
  formateurId: number; // Employe.id (estFormateur=true)
  formationId: number;
  statut: StatutDemande;
  dateEnvoi: Date;
  dateLimiteReponse: Date;
  dateReponse?: Date;
  messagePersonnalise?: string;
  commentaireRefus?: string;
  compensationPrime?: number;
  compensationHeures?: number;
  badgeAttribue?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DemandeCreationAttributes
  extends Optional<DemandeFormateurAttributes, 'id' | 'statut' | 'dateEnvoi'> {}

class DemandeFormateur
  extends Model<DemandeFormateurAttributes, DemandeCreationAttributes>
  implements DemandeFormateurAttributes
{
  public id!: number;
  public formateurId!: number;
  public formationId!: number;
  public statut!: StatutDemande;
  public dateEnvoi!: Date;
  public dateLimiteReponse!: Date;
  public dateReponse?: Date;
  public messagePersonnalise?: string;
  public commentaireRefus?: string;
  public compensationPrime?: number;
  public compensationHeures?: number;
  public badgeAttribue?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DemandeFormateur.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    formateurId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    formationId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    statut: {
      type: DataTypes.ENUM('En_attente', 'Acceptee', 'Refusee', 'Expiree'),
      defaultValue: 'En_attente',
    },
    dateEnvoi: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    dateLimiteReponse: { type: DataTypes.DATE, allowNull: false },
    dateReponse: { type: DataTypes.DATE, allowNull: true },
    messagePersonnalise: { type: DataTypes.TEXT, allowNull: true },
    commentaireRefus: { type: DataTypes.TEXT, allowNull: true },
    compensationPrime: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
    compensationHeures: { type: DataTypes.INTEGER, allowNull: true },
    badgeAttribue: { type: DataTypes.STRING(100), allowNull: true },
  },
  { sequelize, tableName: 'demandes_formateurs', modelName: 'DemandeFormateur' }
);

export default DemandeFormateur;
