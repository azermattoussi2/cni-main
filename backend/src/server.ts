// ============================================
// Fichier : server.ts
// Description : Point d'entrée du serveur Express CNI
// Auteur : Développeur CNI
// Date : 14/04/2026
// ============================================

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

import { connectDB } from './config/database';
import './config/email';
import { startRedisEmailConsumer } from './services/emailQueue.service';
import { logger } from './config/logger';
import { errorHandler } from './middlewares/error.middleware';

// Import des routes
import authRoutes from './routes/auth.routes';
import stagiairesRoutes from './routes/stagiaires.routes';
import formationsRoutes from './routes/formations.routes';
import formateursRoutes from './routes/formateurs.routes';
import employes from './routes/employes.routes';
import departementsRoutes from './routes/departements.routes';
import reportingRoutes from './routes/reporting.routes';
import notificationsRoutes from './routes/notifications.routes';
import messagesRoutes from './routes/messages.routes';
import { attachSocket } from './socket/socketHub';

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARES DE SÉCURITÉ
// ============================================

// Helmet : headers HTTP de sécurité
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS : autoriser le frontend React
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiting : protection contre les attaques par force brute
const limiter = rateLimit({
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
const authLimiter = rateLimit({
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ============================================
// ROUTES API
// ============================================
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/stagiaires', stagiairesRoutes);
app.use('/api/formations', formationsRoutes);
app.use('/api/formateurs', formateursRoutes);
app.use('/api/employes', employes);
app.use('/api/departements', departementsRoutes);
app.use('/api/reporting', reportingRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/messages', messagesRoutes);

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
app.use(errorHandler);

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
    await connectDB();
    logger.info('✅ Connexion MySQL établie');

    startRedisEmailConsumer();

    const httpServer = http.createServer(app);
    attachSocket(httpServer);

    httpServer.listen(PORT, () => {
      logger.info(`🚀 Serveur CNI démarré sur le port ${PORT}`);
      logger.info(`📡 Environnement : ${process.env.NODE_ENV}`);
      logger.info(`🌐 URL : http://localhost:${PORT}`);
      logger.info(`📊 API Health : http://localhost:${PORT}/api/health`);
      logger.info(`💬 Socket.IO : path /socket.io`);
    });
  } catch (error) {
    logger.error('❌ Erreur démarrage serveur:', error);
    process.exit(1);
  }
};

startServer();

export default app;
