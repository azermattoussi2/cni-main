// ============================================
// File d'attente e-mails : mémoire ou Redis (REDIS_URL)
// Le livreur réel est enregistré par config/email.ts (registerEmailDeliver).
// ============================================

import type { SendMailOptions } from 'nodemailer';
import { logger } from '../config/logger';

/** Même forme que SendEmailOptions dans config/email.ts (évite import circulaire). */
export type MailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: SendMailOptions['attachments'];
};

type DeliverFn = (o: MailPayload) => Promise<void>;

let deliver: DeliverFn | null = null;

const memoryQueue: MailPayload[] = [];
let memoryProcessing = false;

const REDIS_KEY = process.env.REDIS_EMAIL_QUEUE_KEY || 'cni:email_queue';
let redisClient: import('ioredis').default | null = null;
let redisConsumerStarted = false;

export function registerEmailDeliver(fn: DeliverFn): void {
  deliver = fn;
}

function hasAttachments(o: MailPayload): boolean {
  return !!(o.attachments && o.attachments.length > 0);
}

async function getRedis(): Promise<import('ioredis').default | null> {
  if (!process.env.REDIS_URL) return null;
  if (redisClient) return redisClient;
  try {
    const { default: Redis } = await import('ioredis');
    redisClient = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
    redisClient.on('error', (e) => logger.error('Redis email queue:', e));
    logger.info('📮 File e-mails Redis connectée');
    return redisClient;
  } catch {
    logger.warn('⚠️ ioredis indisponible — file mémoire uniquement');
    return null;
  }
}

async function drainMemory(): Promise<void> {
  if (memoryProcessing || !deliver) return;
  memoryProcessing = true;
  while (memoryQueue.length) {
    const o = memoryQueue.shift();
    if (o) {
      try {
        await deliver(o);
      } catch {
        /* loggé dans deliver */
      }
    }
  }
  memoryProcessing = false;
}

/**
 * Met en file ou envoie immédiatement.
 */
export async function enqueueEmailDelivery(
  options: MailPayload,
  opts?: { sync?: boolean }
): Promise<void> {
  if (!deliver) {
    logger.error('❌ registerEmailDeliver non appelé');
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
export function startRedisEmailConsumer(): void {
  if (!process.env.REDIS_URL || redisConsumerStarted) return;
  redisConsumerStarted = true;
  void (async () => {
    const r = await getRedis();
    if (!r) return;
    logger.info('🔄 Consommateur Redis e-mails démarré');
    for (;;) {
      try {
        const out = await r.brpop(REDIS_KEY, 10);
        if (out && deliver) {
          const raw = out[1];
          const opts = JSON.parse(raw) as MailPayload;
          await deliver(opts);
        }
      } catch (e) {
        logger.error('Redis consumer email:', e);
        await new Promise((res) => setTimeout(res, 2000));
      }
    }
  })();
}
