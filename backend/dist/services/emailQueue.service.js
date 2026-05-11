"use strict";
// ============================================
// File d'attente e-mails : mémoire ou Redis (REDIS_URL)
// Le livreur réel est enregistré par config/email.ts (registerEmailDeliver).
// ============================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEmailDeliver = registerEmailDeliver;
exports.enqueueEmailDelivery = enqueueEmailDelivery;
exports.startRedisEmailConsumer = startRedisEmailConsumer;
const logger_1 = require("../config/logger");
let deliver = null;
const memoryQueue = [];
let memoryProcessing = false;
const REDIS_KEY = process.env.REDIS_EMAIL_QUEUE_KEY || 'cni:email_queue';
let redisClient = null;
let redisConsumerStarted = false;
function registerEmailDeliver(fn) {
    deliver = fn;
}
function hasAttachments(o) {
    return !!(o.attachments && o.attachments.length > 0);
}
async function getRedis() {
    if (!process.env.REDIS_URL)
        return null;
    if (redisClient)
        return redisClient;
    try {
        const { default: Redis } = await Promise.resolve().then(() => __importStar(require('ioredis')));
        redisClient = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
        redisClient.on('error', (e) => logger_1.logger.error('Redis email queue:', e));
        logger_1.logger.info('📮 File e-mails Redis connectée');
        return redisClient;
    }
    catch {
        logger_1.logger.warn('⚠️ ioredis indisponible — file mémoire uniquement');
        return null;
    }
}
async function drainMemory() {
    if (memoryProcessing || !deliver)
        return;
    memoryProcessing = true;
    while (memoryQueue.length) {
        const o = memoryQueue.shift();
        if (o) {
            try {
                await deliver(o);
            }
            catch {
                /* loggé dans deliver */
            }
        }
    }
    memoryProcessing = false;
}
/**
 * Met en file ou envoie immédiatement.
 */
async function enqueueEmailDelivery(options, opts) {
    if (!deliver) {
        logger_1.logger.error('❌ registerEmailDeliver non appelé');
        return;
    }
    const sync = opts?.sync === true || process.env.EMAIL_QUEUE === 'false';
    if (sync || hasAttachments(options)) {
        await deliver(options);
        return;
    }
    const r = await getRedis();
    if (r) {
        const payload = JSON.stringify({
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });
        await r.rpush(REDIS_KEY, payload);
        return;
    }
    memoryQueue.push(options);
    void drainMemory();
}
/**
 * Boucle BRPOP (à lancer une fois au démarrage du serveur si REDIS_URL).
 */
function startRedisEmailConsumer() {
    if (!process.env.REDIS_URL || redisConsumerStarted)
        return;
    redisConsumerStarted = true;
    void (async () => {
        const r = await getRedis();
        if (!r)
            return;
        logger_1.logger.info('🔄 Consommateur Redis e-mails démarré');
        for (;;) {
            try {
                const out = await r.brpop(REDIS_KEY, 10);
                if (out && deliver) {
                    const raw = out[1];
                    const opts = JSON.parse(raw);
                    await deliver(opts);
                }
            }
            catch (e) {
                logger_1.logger.error('Redis consumer email:', e);
                await new Promise((res) => setTimeout(res, 2000));
            }
        }
    })();
}
//# sourceMappingURL=emailQueue.service.js.map