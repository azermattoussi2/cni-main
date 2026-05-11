"use strict";
// ============================================
// Fichier : models/Employe.ts
// Description : Modèle Sequelize pour les employés CNI
// Rôles : Direction_RH, Manager, Employe, Formateur_Interne
// ============================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class Employe extends sequelize_1.Model {
    // Méthode pour comparer les mots de passe
    async comparePassword(password) {
        return bcryptjs_1.default.compare(password, this.motDePasse);
    }
    // Retourner l'objet sans le mot de passe
    toSafeObject() {
        const obj = this.toJSON();
        delete obj.motDePasse;
        delete obj.refreshToken;
        return obj;
    }
}
Employe.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    nom: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    prenom: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
    },
    motDePasse: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    telephone: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: true,
    },
    poste: {
        type: sequelize_1.DataTypes.STRING(150),
        allowNull: true,
    },
    departementId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
    },
    role: {
        type: sequelize_1.DataTypes.ENUM('Direction_RH', 'Manager', 'Employe', 'Formateur_Interne', 'Formateur_Externe', 'Stagiaire'),
        allowNull: false,
        defaultValue: 'Employe',
    },
    matricule: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
        unique: true,
    },
    dateEntree: {
        type: sequelize_1.DataTypes.DATEONLY,
        allowNull: true,
    },
    isActif: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
    },
    isArchived: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    refreshToken: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    avatar: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    estFormateur: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    domainesCompetences: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON: ["JavaScript", "React", ...]',
    },
    disponibiliteHeures: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    totalHeuresFormation: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    noteFormateur: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    badges: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON: ["Expert", "100h", ...]',
    },
}, {
    sequelize: database_1.sequelize,
    tableName: 'employes',
    modelName: 'Employe',
    hooks: {
        // Hasher le mot de passe avant création/modification
        beforeCreate: async (employe) => {
            if (employe.motDePasse) {
                employe.motDePasse = await bcryptjs_1.default.hash(employe.motDePasse, 12);
            }
        },
        beforeUpdate: async (employe) => {
            if (employe.changed('motDePasse')) {
                employe.motDePasse = await bcryptjs_1.default.hash(employe.motDePasse, 12);
            }
        },
    },
});
exports.default = Employe;
//# sourceMappingURL=Employe.js.map