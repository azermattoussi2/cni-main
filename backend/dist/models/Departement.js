"use strict";
// ============================================
// Fichier : models/Departement.ts
// Description : Modèle Sequelize pour les départements CNI
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class Departement extends sequelize_1.Model {
}
Departement.init({
    id: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    nom: { type: sequelize_1.DataTypes.STRING(150), allowNull: false },
    code: { type: sequelize_1.DataTypes.STRING(20), allowNull: false, unique: true },
    responsableId: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: true },
    budgetFormationAnnuel: {
        type: sequelize_1.DataTypes.DECIMAL(12, 3),
        defaultValue: 0,
        comment: 'Budget annuel en TND',
    },
    budgetUtilise: { type: sequelize_1.DataTypes.DECIMAL(12, 3), defaultValue: 0 },
    budgetRestant: { type: sequelize_1.DataTypes.DECIMAL(12, 3), defaultValue: 0 },
    effectif: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
    description: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
    isActif: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true },
}, {
    sequelize: database_1.sequelize,
    tableName: 'departements',
    modelName: 'Departement',
    hooks: {
        beforeSave: (dept) => {
            // Recalculer le budget restant automatiquement
            dept.budgetRestant =
                Number(dept.budgetFormationAnnuel) - Number(dept.budgetUtilise);
        },
    },
});
exports.default = Departement;
//# sourceMappingURL=Departement.js.map