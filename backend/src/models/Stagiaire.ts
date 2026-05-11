// ============================================
// Fichier : models/Stagiaire.ts
// Description : Modèle Sequelize pour les stagiaires (20+ champs)
// Conforme au cahier des charges section 6
// ============================================

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export type StatutStage =
  | 'En_attente'
  | 'En_examen'
  | 'Accepte'
  | 'Refuse'
  | 'En_cours'
  | 'Termine'
  | 'Annule';

export type NiveauEtudes =
  | 'Licence_1'
  | 'Licence_2'
  | 'Licence_3'
  | 'Master_1'
  | 'Master_2'
  | 'Ingenieur'
  | 'Doctorat'
  | 'Autre';

export interface StagiaireAttributes {
  id: number;
  // Identité
  nom: string;
  prenom: string;
  email: string;
  motDePasse?: string;
  telephone?: string;
  dateNaissance?: Date;
  adresse?: string;
  // Formation
  ecoleUniversite?: string;
  niveauEtudes?: NiveauEtudes;
  specialite?: string;
  anneeEtudes?: number;
  // Stage
  departementId?: number;
  tuteurId?: number;
  dateDebutStage?: Date;
  dateFinStage?: Date;
  dureeStage?: number; // en semaines
  sujetStage?: string;
  typeStage?: string; // PFE, PFA, Observation, etc.
  statut: StatutStage;
  // Documents
  cvPath?: string;
  lettreMotivationPath?: string;
  conventionPath?: string;
  attestationPath?: string;
  /** PDF fiche projet (automatisation workflow) */
  projetPdfPath?: string;
  /** Dernier envoi du planning par e-mail */
  planningEnvoyeAt?: Date;
  conventionSignee: boolean;
  signatureDate?: Date;
  // Évaluations
  evaluationIntermediaire?: string;
  noteIntermediaire?: number;
  evaluationFinale?: string;
  noteFinale?: number;
  // Workflow
  dateValidationRH?: Date;
  dateValidationManager?: Date;
  commentaireRefus?: string;
  // Parsing CV (extrait automatiquement)
  cvNomExtrait?: string;
  cvEmailExtrait?: string;
  cvEcoleExtrait?: string;
  cvNiveauExtrait?: string;
  cvExtractedData?: string;
  cvExtractedHtml?: string;
  aiScore?: number | null;
  aiMoyenne?: number | null;
  aiFeedback?: string;
  aiStrengths?: string;
  aiWeaknesses?: string;
  aiRecommendation?: 'accept' | 'reject' | 'need_interview';
  aiStatus?: 'pending' | 'done' | 'failed';
  aiError?: string;
  aiAnalyzedAt?: Date;
  // Autres
  motivation?: string;
  rgpdConsenti: boolean;
  refreshToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StagiaireCreationAttributes
  extends Optional<
    StagiaireAttributes,
    'id' | 'statut' | 'conventionSignee' | 'rgpdConsenti'
  > {}

class Stagiaire
  extends Model<StagiaireAttributes, StagiaireCreationAttributes>
  implements StagiaireAttributes
{
  public id!: number;
  public nom!: string;
  public prenom!: string;
  public email!: string;
  public motDePasse?: string;
  public telephone?: string;
  public dateNaissance?: Date;
  public adresse?: string;
  public ecoleUniversite?: string;
  public niveauEtudes?: NiveauEtudes;
  public specialite?: string;
  public anneeEtudes?: number;
  public departementId?: number;
  public tuteurId?: number;
  public dateDebutStage?: Date;
  public dateFinStage?: Date;
  public dureeStage?: number;
  public sujetStage?: string;
  public typeStage?: string;
  public statut!: StatutStage;
  public cvPath?: string;
  public lettreMotivationPath?: string;
  public conventionPath?: string;
  public attestationPath?: string;
  public projetPdfPath?: string;
  public planningEnvoyeAt?: Date;
  public conventionSignee!: boolean;
  public signatureDate?: Date;
  public evaluationIntermediaire?: string;
  public noteIntermediaire?: number;
  public evaluationFinale?: string;
  public noteFinale?: number;
  public dateValidationRH?: Date;
  public dateValidationManager?: Date;
  public commentaireRefus?: string;
  public cvNomExtrait?: string;
  public cvEmailExtrait?: string;
  public cvEcoleExtrait?: string;
  public cvNiveauExtrait?: string;
  public cvExtractedData?: string;
  public cvExtractedHtml?: string;
  public aiScore?: number | null;
  public aiMoyenne?: number | null;
  public aiFeedback?: string;
  public aiStrengths?: string;
  public aiWeaknesses?: string;
  public aiRecommendation?: 'accept' | 'reject' | 'need_interview';
  public aiStatus?: 'pending' | 'done' | 'failed';
  public aiError?: string;
  public aiAnalyzedAt?: Date;
  public motivation?: string;
  public rgpdConsenti!: boolean;
  public refreshToken?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Stagiaire.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    nom: { type: DataTypes.STRING(100), allowNull: false },
    prenom: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
    motDePasse: { type: DataTypes.STRING(255), allowNull: true },
    telephone: { type: DataTypes.STRING(20), allowNull: true },
    dateNaissance: { type: DataTypes.DATEONLY, allowNull: true },
    adresse: { type: DataTypes.TEXT, allowNull: true },
    ecoleUniversite: { type: DataTypes.STRING(200), allowNull: true },
    niveauEtudes: {
      type: DataTypes.ENUM('Licence_1','Licence_2','Licence_3','Master_1','Master_2','Ingenieur','Doctorat','Autre'),
      allowNull: true,
    },
    specialite: { type: DataTypes.STRING(150), allowNull: true },
    anneeEtudes: { type: DataTypes.INTEGER, allowNull: true },
    departementId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    tuteurId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    dateDebutStage: { type: DataTypes.DATEONLY, allowNull: true },
    dateFinStage: { type: DataTypes.DATEONLY, allowNull: true },
    dureeStage: { type: DataTypes.INTEGER, allowNull: true },
    sujetStage: { type: DataTypes.STRING(300), allowNull: true },
    typeStage: { type: DataTypes.STRING(100), allowNull: true },
    statut: {
      type: DataTypes.ENUM('En_attente','En_examen','Accepte','Refuse','En_cours','Termine','Annule'),
      defaultValue: 'En_attente',
    },
    cvPath: { type: DataTypes.STRING(500), allowNull: true },
    lettreMotivationPath: { type: DataTypes.STRING(500), allowNull: true },
    conventionPath: { type: DataTypes.STRING(500), allowNull: true },
    attestationPath: { type: DataTypes.STRING(500), allowNull: true },
    projetPdfPath: { type: DataTypes.STRING(500), allowNull: true },
    planningEnvoyeAt: { type: DataTypes.DATE, allowNull: true },
    conventionSignee: { type: DataTypes.BOOLEAN, defaultValue: false },
    signatureDate: { type: DataTypes.DATE, allowNull: true },
    evaluationIntermediaire: { type: DataTypes.TEXT, allowNull: true },
    noteIntermediaire: { type: DataTypes.FLOAT, allowNull: true },
    evaluationFinale: { type: DataTypes.TEXT, allowNull: true },
    noteFinale: { type: DataTypes.FLOAT, allowNull: true },
    dateValidationRH: { type: DataTypes.DATE, allowNull: true },
    dateValidationManager: { type: DataTypes.DATE, allowNull: true },
    commentaireRefus: { type: DataTypes.TEXT, allowNull: true },
    cvNomExtrait: { type: DataTypes.STRING(200), allowNull: true },
    cvEmailExtrait: { type: DataTypes.STRING(255), allowNull: true },
    cvEcoleExtrait: { type: DataTypes.STRING(200), allowNull: true },
    cvNiveauExtrait: { type: DataTypes.STRING(100), allowNull: true },
    cvExtractedData: { type: DataTypes.TEXT('long'), allowNull: true },
    cvExtractedHtml: { type: DataTypes.TEXT('long'), allowNull: true },
    aiScore: { type: DataTypes.FLOAT, allowNull: true },
    aiMoyenne: { type: DataTypes.FLOAT, allowNull: true },
    aiFeedback: { type: DataTypes.TEXT('long'), allowNull: true },
    aiStrengths: { type: DataTypes.TEXT('long'), allowNull: true },
    aiWeaknesses: { type: DataTypes.TEXT('long'), allowNull: true },
    aiRecommendation: { type: DataTypes.ENUM('accept', 'reject', 'need_interview'), allowNull: true },
    aiStatus: { type: DataTypes.ENUM('pending', 'done', 'failed'), allowNull: true },
    aiError: { type: DataTypes.TEXT, allowNull: true },
    aiAnalyzedAt: { type: DataTypes.DATE, allowNull: true },
    motivation: { type: DataTypes.TEXT, allowNull: true },
    rgpdConsenti: { type: DataTypes.BOOLEAN, defaultValue: false },
    refreshToken: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: 'stagiaires',
    modelName: 'Stagiaire',
  }
);

export default Stagiaire;
