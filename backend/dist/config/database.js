"use strict";
// ============================================
// Fichier : config/database.ts
// Description : Configuration Sequelize + MySQL 8
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const logger_1 = require("./logger");
// Instance Sequelize unique (singleton)
exports.sequelize = new sequelize_1.Sequelize(process.env.DB_NAME || 'cni_stages_formations', process.env.DB_USER || 'root', process.env.DB_PASSWORD || '', {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: (msg) => {
        if (process.env.NODE_ENV === 'development') {
            logger_1.logger.debug(msg);
        }
    },
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    timezone: '+01:00', // Heure de Tunis (CET)
    define: {
        underscored: false, // utiliser camelCase
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
    },
});
/**
 * Connexion à la base de données MySQL
 * Synchronise les modèles (alter:true pour ne pas perdre les données)
 */
const connectDB = async () => {
    try {
        await exports.sequelize.authenticate();
        logger_1.logger.info('📦 Connexion MySQL réussie');
        // Développement : créer les tables manquantes uniquement (sans ALTER).
        // `sync({ alter: true })` provoque souvent chez MySQL : « Too many keys specified; max 64 keys allowed »
        // car Sequelize regroupe trop de changements d’index dans un seul ALTER.
        // Schéma complet : importer `database.sql` ; migration ponctuelle : DB_SYNC_ALTER=true (à vos risques).
        if (process.env.NODE_ENV === 'development') {
            if (process.env.DB_SYNC_ALTER === 'true') {
                await exports.sequelize.sync();
                logger_1.logger.warn('🔄 sync(alter: true) exécuté — préférez les scripts SQL si une erreur MySQL apparaît.');
            }
            else {
                await exports.sequelize.sync();
                logger_1.logger.info('🔄 Tables Sequelize vérifiées (création si absentes ; alter désactivé).');
            }
        }
        else {
            logger_1.logger.info('ℹ️ Synchronisation auto désactivée hors développement.');
        }
    }
    catch (error) {
        logger_1.logger.error('❌ Erreur connexion MySQL:', error);
        throw error;
    }
};
exports.connectDB = connectDB;
//# sourceMappingURL=database.js.map