"use strict";
// ============================================
// Fichier : server.ts
// Description : Point d'entrée du serveur Express CNI
// Auteur : Développeur CNI
// Date : 14/04/2026
// ============================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Charger les variables d'environnement
dotenv_1.default.config();
const database_1 = require("./config/database");
require("./config/email");
const emailQueue_service_1 = require("./services/emailQueue.service");
const logger_1 = require("./config/logger");
const error_middleware_1 = require("./middlewares/error.middleware");
// Import des routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const stagiaires_routes_1 = __importDefault(require("./routes/stagiaires.routes"));
const formations_routes_1 = __importDefault(require("./routes/formations.routes"));
const formateurs_routes_1 = __importDefault(require("./routes/formateurs.routes"));
const employes_routes_1 = __importDefault(require("./routes/employes.routes"));
const departements_routes_1 = __importDefault(require("./routes/departements.routes"));
const reporting_routes_1 = __importDefault(require("./routes/reporting.routes"));
const notifications_routes_1 = __importDefault(require("./routes/notifications.routes"));
const messages_routes_1 = __importDefault(require("./routes/messages.routes"));
const socketHub_1 = require("./socket/socketHub");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// ============================================
// MIDDLEWARES DE SÉCURITÉ
// ============================================
// Helmet : headers HTTP de sécurité
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// CORS : autoriser le frontend React
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Rate Limiting : protection contre les attaques par force brute
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // max 200 requêtes par fenêtre
    message: {
        success: false,
        message: 'Trop de requêtes. Veuillez réessayer dans 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// Rate limiting strict pour l'authentification
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
    },
});
// ============================================
// PARSERS
// ============================================
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Servir les fichiers uploadés
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '..', 'uploads')));
// ============================================
// ROUTES API
// ============================================
app.use('/api/auth', authLimiter, auth_routes_1.default);
app.use('/api/stagiaires', stagiaires_routes_1.default);
app.use('/api/formations', formations_routes_1.default);
app.use('/api/formateurs', formateurs_routes_1.default);
app.use('/api/employes', employes_routes_1.default);
app.use('/api/departements', departements_routes_1.default);
app.use('/api/reporting', reporting_routes_1.default);
app.use('/api/notifications', notifications_routes_1.default);
app.use('/api/messages', messages_routes_1.default);
// Route de santé (health check)
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API CNI Stages & Formations - Serveur opérationnel',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});
// ============================================
// GESTION D'ERREURS GLOBALE
// ============================================
app.use(error_middleware_1.errorHandler);
// Route 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route introuvable : ${req.method} ${req.originalUrl}`,
    });
});
// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================
const startServer = async () => {
    try {
        // Connexion à la base de données
        await (0, database_1.connectDB)();
        logger_1.logger.info('✅ Connexion MySQL établie');
        (0, emailQueue_service_1.startRedisEmailConsumer)();
        const httpServer = http_1.default.createServer(app);
        (0, socketHub_1.attachSocket)(httpServer);
        httpServer.listen(PORT, () => {
            logger_1.logger.info(`🚀 Serveur CNI démarré sur le port ${PORT}`);
            logger_1.logger.info(`📡 Environnement : ${process.env.NODE_ENV}`);
            logger_1.logger.info(`🌐 URL : http://localhost:${PORT}`);
            logger_1.logger.info(`📊 API Health : http://localhost:${PORT}/api/health`);
            logger_1.logger.info(`💬 Socket.IO : path /socket.io`);
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Erreur démarrage serveur:', error);
        process.exit(1);
    }
};
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map