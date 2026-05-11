"use strict";
// ============================================
// Fichier : models/DemandeFormateur.ts
// Description : Suivi des sollicitations formateurs internes
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class DemandeFormateur extends sequelize_1.Model {
}
DemandeFormateur.init({
    id: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    formateurId: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false },
    formationId: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false },
    statut: {
        type: sequelize_1.DataTypes.ENUM('En_attente', 'Acceptee', 'Refusee', 'Expiree'),
        defaultValue: 'En_attente',
    },
    dateEnvoi: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
    dateLimiteReponse: { type: sequelize_1.DataTypes.DATE, allowNull: false },
    dateReponse: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    messagePersonnalise: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    commentaireRefus: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    compensationPrime: { type: sequelize_1.DataTypes.DECIMAL(10, 3), allowNull: true },
    compensationHeures: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    badgeAttribue: { type: sequelize_1.DataTypes.STRING(100), allowNull: true },
}, { sequelize: database_1.sequelize, tableName: 'demandes_formateurs', modelName: 'DemandeFormateur' });
exports.default = DemandeFormateur;
//# sourceMappingURL=DemandeFormateur.js.map