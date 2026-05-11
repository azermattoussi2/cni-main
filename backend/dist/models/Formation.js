"use strict";
// ============================================
// Fichier : models/Formation.ts
// Description : Modèle Sequelize pour les formations (25+ champs)
// Conforme au cahier des charges section 6
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Formation extends sequelize_1.Model {
}
Formation.init({
    id: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    titre: { type: sequelize_1.DataTypes.STRING(300), allowNull: false },
    description: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    domaine: {
        type: sequelize_1.DataTypes.ENUM('Informatique', 'Management', 'Communication', 'Finance', 'RH', 'Securite', 'Langue', 'Technique', 'Autre'),
        allowNull: false,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM('Interne', 'Externe', 'E_learning', 'Mixte', 'Certification'),
        allowNull: false,
    },
    niveau: { type: sequelize_1.DataTypes.STRING(50), allowNull: true },
    dureeJours: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    dureeHeures: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    dateDebut: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    dateFin: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    lieu: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
    maxParticipants: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    minParticipants: { type: sequelize_1.DataTypes.INTEGER, allowNull: true, defaultValue: 1 },
    nbInscrits: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
    cout: { type: sequelize_1.DataTypes.DECIMAL(12, 3), allowNull: true },
    coutParParticipant: { type: sequelize_1.DataTypes.DECIMAL(12, 3), allowNull: true },
    budgetDepartementId: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true },
    formateurId: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true },
    formateurNom: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
    statut: {
        type: sequelize_1.DataTypes.ENUM('Brouillon', 'Publiee', 'En_cours', 'Terminee', 'Annulee', 'Archivee'),
        defaultValue: 'Brouillon',
    },
    noteSatisfaction: { type: sequelize_1.DataTypes.FLOAT, allowNull: true },
    nbEvaluations: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
    supportPath: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    certificatTemplate: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    objectifs: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    prerequis: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    programme: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    lienVisio: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    rappelJm7Envoye: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    rappelJm2Envoye: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    questionnaireSatisfactionEnvoye: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    isActif: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true },
}, {
    sequelize: database_1.sequelize,
    tableName: 'formations',
    modelName: 'Formation',
});
exports.default = Formation;
//# sourceMappingURL=Formation.js.map