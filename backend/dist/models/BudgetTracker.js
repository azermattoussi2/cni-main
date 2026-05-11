"use strict";
// ============================================
// Fichier : models/BudgetTracker.ts
// Description : Suivi mensuel détaillé du budget formations
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
class BudgetTracker extends sequelize_1.Model {
}
BudgetTracker.init({
    id: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    departementId: { type: sequelize_1.DataTypes.INTEGER.UNSIGNED, allowNull: false },
    annee: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    mois: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 12 } },
    budgetAlloue: { type: sequelize_1.DataTypes.DECIMAL(12, 3), allowNull: false },
    budgetUtilise: { type: sequelize_1.DataTypes.DECIMAL(12, 3), defaultValue: 0 },
    budgetRestant: { type: sequelize_1.DataTypes.DECIMAL(12, 3), defaultValue: 0 },
    pourcentageUtilisation: { type: sequelize_1.DataTypes.FLOAT, defaultValue: 0 },
    alerteSent60: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    alerteSent80: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    alerteSent90: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    nbFormationsFinancees: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 0 },
    details: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
}, {
    sequelize: database_1.sequelize,
    tableName: 'budget_tracker',
    modelName: 'BudgetTracker',
    indexes: [{ unique: true, fields: ['departementId', 'annee', 'mois'] }],
});
exports.default = BudgetTracker;
//# sourceMappingURL=BudgetTracker.js.map