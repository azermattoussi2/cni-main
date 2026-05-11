import { Sequelize } from 'sequelize';
export declare const sequelize: Sequelize;
/**
 * Connexion à la base de données MySQL
 * Synchronise les modèles (alter:true pour ne pas perdre les données)
 */
export declare const connectDB: () => Promise<void>;
//# sourceMappingURL=database.d.ts.map