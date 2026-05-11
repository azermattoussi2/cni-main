"use strict";
// ============================================
// Fichier : models/InscriptionFormation.ts
// Description : Table de liaison Employé-Formation avec workflow validation
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class InscriptionFormation extends sequelize_1.Model {
}
InscriptionFormation.init({
    id: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    employeId: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false },
    formationId: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false },
    statut: {
        type: sequelize_1.DataTypes.ENUM('En_attente_manager', 'En_attente_RH', 'Validee', 'Refusee', 'Liste_attente', 'Annulee', 'Terminee'),
        defaultValue: 'En_attente_manager',
    },
    dateDemandeEmploye: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
    dateValidationManager: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    dateValidationRH: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    managerId: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true },
    commentaireManager: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    commentaireRH: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    commentaireRefus: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    tauxPresence: { type: sequelize_1.DataTypes.FLOAT, allowNull: true },
    noteSatisfaction: { type: sequelize_1.DataTypes.FLOAT, allowNull: true },
    commentaireSatisfaction: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    certificationObtenue: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    certificatPath: { type: sequelize_1.DataTypes.STRING(500), allowNull: true },
    dateEnvoiCertificat: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    coutReel: { type: sequelize_1.DataTypes.DECIMAL(12, 3), allowNull: true },
    budgetDepartementImpacte: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    rappelJ7Envoye: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    rappelJ2Envoye: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    rappelJ1Envoye: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
}, {
    sequelize: database_1.sequelize,
    tableName: 'inscriptions_formations',
    modelName: 'InscriptionFormation',
    indexes: [{ unique: true, fields: ['employeId', 'formationId'] }],
});
exports.default = InscriptionFormation;
//# sourceMappingURL=InscriptionFormation.js.map