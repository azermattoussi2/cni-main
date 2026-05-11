// ============================================
// Fichier : types/index.ts
// Description : Types TypeScript globaux du projet
// ============================================

export type Role =
  | 'Direction_RH'
  | 'Manager'
  | 'Employe'
  | 'Formateur_Interne'
  | 'Formateur_Externe'
  | 'Stagiaire';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  departementId?: number;
  departement?: Departement;
  poste?: string;
  avatar?: string;
  estFormateur?: boolean;
  /** JSON stringifié côté API */
  domainesCompetences?: string;
  disponibiliteHeures?: number;
  badges?: string | string[];
  totalHeuresFormation?: number;
  noteFormateur?: number;
}

export interface Departement {
  id: number;
  nom: string;
  code: string;
  budgetFormationAnnuel: number;
  budgetUtilise: number;
  budgetRestant: number;
  effectif?: number;
}

export type StatutStage =
  | 'En_attente' | 'En_examen' | 'Accepte'
  | 'Refuse' | 'En_cours' | 'Termine' | 'Annule';

export interface Stagiaire {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  ecoleUniversite?: string;
  niveauEtudes?: string;
  specialite?: string;
  departementId?: number;
  departement?: Departement;
  tuteurId?: number;
  tuteur?: User;
  dateDebutStage?: string;
  dateFinStage?: string;
  dureeStage?: number;
  sujetStage?: string;
  typeStage?: string;
  statut: StatutStage;
  cvPath?: string;
  lettreMotivationPath?: string;
  conventionPath?: string;
  attestationPath?: string;
  projetPdfPath?: string;
  planningEnvoyeAt?: string;
  conventionSignee: boolean;
  evaluationIntermediaire?: string;
  noteIntermediaire?: number;
  noteFinale?: number;
  evaluationFinale?: string;
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
  aiAnalyzedAt?: string;
  motivation?: string;
  rgpdConsenti: boolean;
  createdAt: string;
  updatedAt: string;
}

export type StatutFormation =
  | 'Brouillon' | 'Publiee' | 'En_cours'
  | 'Terminee' | 'Annulee' | 'Archivee';

export interface Formation {
  id: number;
  /** Présent pour les employés connectés : demande d’inscription existante */
  monInscription?: { id: number; statut: string } | null;
  titre: string;
  description?: string;
  domaine: string;
  type: string;
  niveau?: string;
  dureeJours?: number;
  dureeHeures?: number;
  dateDebut?: string;
  dateFin?: string;
  lieu?: string;
  maxParticipants?: number;
  nbInscrits: number;
  cout?: number;
  coutParParticipant?: number;
  formateurId?: number;
  formateurInterne?: User;
  formateurNom?: string;
  statut: StatutFormation;
  noteSatisfaction?: number;
  objectifs?: string;
  programme?: string;
  lienVisio?: string;
  createdAt: string;
}

export type StatutInscription =
  | 'En_attente_manager' | 'En_attente_RH' | 'Validee'
  | 'Refusee' | 'Liste_attente' | 'Annulee' | 'Terminee';

export interface Inscription {
  id: number;
  employeId: number;
  employe?: User;
  formationId: number;
  formation?: Formation;
  statut: StatutInscription;
  dateDemandeEmploye: string;
  dateValidationManager?: string;
  dateValidationRH?: string;
  tauxPresence?: number;
  noteSatisfaction?: number;
  certificationObtenue: boolean;
  certificatPath?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ champ: string; message: string }>;
}

// Labels FR pour les statuts
export const STATUT_STAGE_LABELS: Record<StatutStage, string> = {
  En_attente: 'En attente',
  En_examen: 'En cours d\'examen',
  Accepte: 'Accepté',
  Refuse: 'Refusé',
  En_cours: 'En cours',
  Termine: 'Terminé',
  Annule: 'Annulé',
};

export const STATUT_INSCRIPTION_LABELS: Record<StatutInscription, string> = {
  En_attente_manager: 'En attente manager',
  En_attente_RH: 'En attente RH',
  Validee: 'Validée',
  Refusee: 'Refusée',
  Liste_attente: 'Liste d\'attente',
  Annulee: 'Annulée',
  Terminee: 'Terminée',
};

export const ROLE_LABELS: Record<Role, string> = {
  Direction_RH: 'Direction / RH',
  Manager: 'Manager',
  Employe: 'Employé',
  Formateur_Interne: 'Formateur Interne',
  Formateur_Externe: 'Formateur Externe',
  Stagiaire: 'Stagiaire',
};
