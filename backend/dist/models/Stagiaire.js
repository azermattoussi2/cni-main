"use strict";
// ============================================
// Fichier : models/Stagiaire.ts
// Description : Modèle Sequelize pour les stagiaires (20+ champs)
// Conforme au cahier des charges section 6
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Stagiaire extends sequelize_1.Model {
}
Stagiaire.init({
    id: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    nom: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
    prenom: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
    email: { type: sequelize_1.DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
    motDePasse: { type: sequelize_1.DataTypes.STRING(255), allowNull: true },
    telephone: { type: sequelize_1.DataTypes.STRING(20), allowNull: true },
    dateNaissance: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
    adresse: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    ecoleUniversite: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
    niveauEtudes: {
        type: sequelize_1.DataTypes.ENUM('Licence_1', 'Licence_2', 'Licence_3', 'Master_1', 'Master_2', 'Ingenieur', 'Doctorat', 'Autre'),
        allowNull: true,
    },
    specialite: { type: sequelize_1.DataTypes.STRING(150), allowNull: true },
    anneeEtudes: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    departementId: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true },
    tuteurId: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true },
    dateDebutStage: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
    dateFinStage: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
    dureeStage: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    sujetStage: { type: sequelize_1.DataTypes.STRING(300), allowNull: true },
    typeStage: { type: sequelize_1.DataTypes.STRING(100), allowNull: true },
    statut: {
        type: sequelize_1.DataTypes.ENUM('En_attente', 'En_examen', 'Accepte', 'Refuse', 'En_cours', 'Termine', 'Annule'),
        defaultValue: 'En_attente',
    },
    cvPath: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    lettreMotivationPath: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    conventionPath: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    attestationPath: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    projetPdfPath: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    planningEnvoyeAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    conventionSignee: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    signatureDate: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    evaluationIntermediaire: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    noteIntermediaire: { type: sequelize_1.DataTypes.FLOAT, allowNull: true },
    evaluationFinale: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    noteFinale: { type: sequelize_1.DataTypes.FLOAT, allowNull: true },
    dateValidationRH: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    dateValidationManager: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    commentaireRefus: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    cvNomExtrait: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
    cvEmailExtrait: { type: sequelize_1.DataTypes.STRING(255), allowNull: true },
    cvEcoleExtrait: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
    cvNiveauExtrait: { type: sequelize_1.DataTypes.STRING(100), allowNull: true },
    cvExtractedData: { type: sequelize_1.DataTypes.TEXT('long'), allowNull: true },
    cvExtractedHtml: { type: sequelize_1.DataTypes.TEXT('long'), allowNull: true },
    aiScore: { type: sequelize_1.DataTypes.FLOAT, allowNull: true },
    aiMoyenne: { type: sequelize_1.DataTypes.FLOAT, allowNull: true },
    aiFeedback: { type: sequelize_1.DataTypes.TEXT('long'), allowNull: true },
    aiStrengths: { type: sequelize_1.DataTypes.TEXT('long'), allowNull: true },
    aiWeaknesses: { type: sequelize_1.DataTypes.TEXT('long'), allowNull: true },
    aiRecommendation: { type: sequelize_1.DataTypes.ENUM('accept', 'reject', 'need_interview'), allowNull: true },
    aiStatus: { type: sequelize_1.DataTypes.ENUM('pending', 'done', 'failed'), allowNull: true },
    aiError: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    aiAnalyzedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    motivation: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    rgpdConsenti: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    refreshToken: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
}, {
    sequelize: database_1.sequelize,
    tableName: 'stagiaires',
    modelName: 'Stagiaire',
});
exports.default = Stagiaire;
//# sourceMappingURL=Stagiaire.js.map