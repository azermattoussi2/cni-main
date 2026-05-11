"use strict";
// ============================================
// Fichier : models/Formateur.ts
// Description : Modèle Sequelize pour les formateurs externes
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class FormateurExterne extends sequelize_1.Model {
}
FormateurExterne.init({
    id: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    nom: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
    prenom: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
    email: { type: sequelize_1.DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
    telephone: { type: sequelize_1.DataTypes.STRING(20), allowNull: true },
    societe: { type: sequelize_1.DataTypes.STRING(200), allowNull: true },
    specialites: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    cv: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    tarifJournalier: { type: sequelize_1.DataTypes.DECIMAL(10, 3), allowNull: true },
    tarifHoraire: { type: sequelize_1.DataTypes.DECIMAL(10, 3), allowNull: true },
    disponible: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true },
    note: { type: sequelize_1.DataTypes.FLOAT, allowNull: true },
    nbFormations: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
    historiqueFormations: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    contratPath: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    rib: { type: sequelize_1.DataTypes.STRING(30), allowNull: true },
    isActif: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true },
}, { sequelize: database_1.sequelize, tableName: 'formateurs_externes', modelName: 'FormateurExterne' });
exports.default = FormateurExterne;
//# sourceMappingURL=FormateurExterne.js.map