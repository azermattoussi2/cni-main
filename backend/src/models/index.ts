// ============================================
// Fichier : models/index.ts
// Description : Point d'entrée des modèles + définition des associations
// Importer ce fichier pour avoir accès à tous les modèles et leurs relations
// ============================================

import Employe from './Employe';
import Departement from './Departement';
import Stagiaire from './Stagiaire';
import Formation from './Formation';
import InscriptionFormation from './InscriptionFormation';
import FormateurExterne from './FormateurExterne';
import DemandeFormateur from './DemandeFormateur';
import BudgetTracker from './BudgetTracker';
import OtpVerification from './OtpVerification';
import Message from './Message';

// ============================================
// DÉFINITION DES ASSOCIATIONS (relations entre tables)
// ============================================

// --- Département ↔ Employé ---
Departement.hasMany(Employe, { foreignKey: 'departementId', as: 'employes' });
Employe.belongsTo(Departement, { foreignKey: 'departementId', as: 'departement' });

// Manager du département
Departement.belongsTo(Employe, { foreignKey: 'responsableId', as: 'responsable' });

// --- Département ↔ Stagiaire ---
Departement.hasMany(Stagiaire, { foreignKey: 'departementId', as: 'stagiaires' });
Stagiaire.belongsTo(Departement, { foreignKey: 'departementId', as: 'departement' });

// --- Employé (tuteur) ↔ Stagiaire ---
Employe.hasMany(Stagiaire, { foreignKey: 'tuteurId', as: 'stagiairesSuivis' });
Stagiaire.belongsTo(Employe, { foreignKey: 'tuteurId', as: 'tuteur' });

// --- Formation ↔ Formateur (interne = Employé) ---
Employe.hasMany(Formation, { foreignKey: 'formateurId', as: 'formationsAnimees' });
Formation.belongsTo(Employe, { foreignKey: 'formateurId', as: 'formateurInterne' });

// --- Formation ↔ Département (budget) ---
Departement.hasMany(Formation, { foreignKey: 'budgetDepartementId', as: 'formations' });
Formation.belongsTo(Departement, { foreignKey: 'budgetDepartementId', as: 'departementBudget' });

// --- Employe ↔ Formation (many-to-many via InscriptionFormation) ---
Employe.hasMany(InscriptionFormation, { foreignKey: 'employeId', as: 'inscriptions' });
InscriptionFormation.belongsTo(Employe, { foreignKey: 'employeId', as: 'employe' });

Formation.hasMany(InscriptionFormation, { foreignKey: 'formationId', as: 'inscriptions' });
InscriptionFormation.belongsTo(Formation, { foreignKey: 'formationId', as: 'formation' });

// Manager validant l'inscription
Employe.hasMany(InscriptionFormation, { foreignKey: 'managerId', as: 'validationsManager' });
InscriptionFormation.belongsTo(Employe, { foreignKey: 'managerId', as: 'manager' });

// --- DemandeFormateur ↔ Employe (formateur interne) ---
Employe.hasMany(DemandeFormateur, { foreignKey: 'formateurId', as: 'demandesFormation' });
DemandeFormateur.belongsTo(Employe, { foreignKey: 'formateurId', as: 'formateur' });

// --- DemandeFormateur ↔ Formation ---
Formation.hasMany(DemandeFormateur, { foreignKey: 'formationId', as: 'demandesFormateur' });
DemandeFormateur.belongsTo(Formation, { foreignKey: 'formationId', as: 'formation' });

// --- BudgetTracker ↔ Département ---
Departement.hasMany(BudgetTracker, { foreignKey: 'departementId', as: 'budgets' });
BudgetTracker.belongsTo(Departement, { foreignKey: 'departementId', as: 'departement' });

// --- Messages ---
Message.belongsTo(Employe, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(Employe, { foreignKey: 'recipientId', as: 'recipient' });

// Exporter tous les modèles
export {
  Employe,
  Departement,
  Stagiaire,
  Formation,
  InscriptionFormation,
  FormateurExterne,
  DemandeFormateur,
  BudgetTracker,
  OtpVerification,
  Message,
};
