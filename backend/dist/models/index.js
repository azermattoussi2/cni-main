"use strict";
// ============================================
// Fichier : models/index.ts
// Description : Point d'entrée des modèles + définition des associations
// Importer ce fichier pour avoir accès à tous les modèles et leurs relations
// ============================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = exports.OtpVerification = exports.BudgetTracker = exports.DemandeFormateur = exports.FormateurExterne = exports.InscriptionFormation = exports.Formation = exports.Stagiaire = exports.Departement = exports.Employe = void 0;
const Employe_1 = __importDefault(require("./Employe"));
exports.Employe = Employe_1.default;
const Departement_1 = __importDefault(require("./Departement"));
exports.Departement = Departement_1.default;
const Stagiaire_1 = __importDefault(require("./Stagiaire"));
exports.Stagiaire = Stagiaire_1.default;
const Formation_1 = __importDefault(require("./Formation"));
exports.Formation = Formation_1.default;
const InscriptionFormation_1 = __importDefault(require("./InscriptionFormation"));
exports.InscriptionFormation = InscriptionFormation_1.default;
const FormateurExterne_1 = __importDefault(require("./FormateurExterne"));
exports.FormateurExterne = FormateurExterne_1.default;
const DemandeFormateur_1 = __importDefault(require("./DemandeFormateur"));
exports.DemandeFormateur = DemandeFormateur_1.default;
const BudgetTracker_1 = __importDefault(require("./BudgetTracker"));
exports.BudgetTracker = BudgetTracker_1.default;
const OtpVerification_1 = __importDefault(require("./OtpVerification"));
exports.OtpVerification = OtpVerification_1.default;
const Message_1 = __importDefault(require("./Message"));
exports.Message = Message_1.default;
// ============================================
// DÉFINITION DES ASSOCIATIONS (relations entre tables)
// ============================================
// --- Département ↔ Employé ---
Departement_1.default.hasMany(Employe_1.default, { foreignKey: 'departementId', as: 'employes' });
Employe_1.default.belongsTo(Departement_1.default, { foreignKey: 'departementId', as: 'departement' });
// Manager du département
Departement_1.default.belongsTo(Employe_1.default, { foreignKey: 'responsableId', as: 'responsable' });
// --- Département ↔ Stagiaire ---
Departement_1.default.hasMany(Stagiaire_1.default, { foreignKey: 'departementId', as: 'stagiaires' });
Stagiaire_1.default.belongsTo(Departement_1.default, { foreignKey: 'departementId', as: 'departement' });
// --- Employé (tuteur) ↔ Stagiaire ---
Employe_1.default.hasMany(Stagiaire_1.default, { foreignKey: 'tuteurId', as: 'stagiairesSuivis' });
Stagiaire_1.default.belongsTo(Employe_1.default, { foreignKey: 'tuteurId', as: 'tuteur' });
// --- Formation ↔ Formateur (interne = Employé) ---
Employe_1.default.hasMany(Formation_1.default, { foreignKey: 'formateurId', as: 'formationsAnimees' });
Formation_1.default.belongsTo(Employe_1.default, { foreignKey: 'formateurId', as: 'formateurInterne' });
// --- Formation ↔ Département (budget) ---
Departement_1.default.hasMany(Formation_1.default, { foreignKey: 'budgetDepartementId', as: 'formations' });
Formation_1.default.belongsTo(Departement_1.default, { foreignKey: 'budgetDepartementId', as: 'departementBudget' });
// --- Employe ↔ Formation (many-to-many via InscriptionFormation) ---
Employe_1.default.hasMany(InscriptionFormation_1.default, { foreignKey: 'employeId', as: 'inscriptions' });
InscriptionFormation_1.default.belongsTo(Employe_1.default, { foreignKey: 'employeId', as: 'employe' });
Formation_1.default.hasMany(InscriptionFormation_1.default, { foreignKey: 'formationId', as: 'inscriptions' });
InscriptionFormation_1.default.belongsTo(Formation_1.default, { foreignKey: 'formationId', as: 'formation' });
// Manager validant l'inscription
Employe_1.default.hasMany(InscriptionFormation_1.default, { foreignKey: 'managerId', as: 'validationsManager' });
InscriptionFormation_1.default.belongsTo(Employe_1.default, { foreignKey: 'managerId', as: 'manager' });
// --- DemandeFormateur ↔ Employe (formateur interne) ---
Employe_1.default.hasMany(DemandeFormateur_1.default, { foreignKey: 'formateurId', as: 'demandesFormation' });
DemandeFormateur_1.default.belongsTo(Employe_1.default, { foreignKey: 'formateurId', as: 'formateur' });
// --- DemandeFormateur ↔ Formation ---
Formation_1.default.hasMany(DemandeFormateur_1.default, { foreignKey: 'formationId', as: 'demandesFormateur' });
DemandeFormateur_1.default.belongsTo(Formation_1.default, { foreignKey: 'formationId', as: 'formation' });
// --- BudgetTracker ↔ Département ---
Departement_1.default.hasMany(BudgetTracker_1.default, { foreignKey: 'departementId', as: 'budgets' });
BudgetTracker_1.default.belongsTo(Departement_1.default, { foreignKey: 'departementId', as: 'departement' });
// --- Messages ---
Message_1.default.belongsTo(Employe_1.default, { foreignKey: 'senderId', as: 'sender' });
Message_1.default.belongsTo(Employe_1.default, { foreignKey: 'recipientId', as: 'recipient' });
//# sourceMappingURL=index.js.map