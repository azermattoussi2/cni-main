import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { verifyAccessToken } from '../config/jwt';
import { MessageService } from '../services/message.service';
import { setIo } from './ioSingleton';
import { INTERNAL_STAFF_ROLES, isInternalStaffRole } from '../constants/roles';
const MESSAGING_ROLES = [...INTERNAL_STAFF_ROLES];

export function attachSocket(httpServer: HttpServer): Server {
  const origin = process.env.FRONTEND_URL || 'http://localhost:5173';
  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin, credentials: true },
  });
  setIo(io);

  io.use((socket, next) => {
    try {
      const raw =
        (socket.handshake.auth?.token as string | undefined) ||
        (typeof socket.handshake.headers?.authorization === 'string'
          ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
          : undefined);
      if (!raw) {
        next(new Error('Auth requise'));
        return;
      }
      const payload = verifyAccessToken(raw);
      if (!isInternalStaffRole(payload.role) || !MESSAGING_ROLES.includes(payload.role)) {
        next(new Error('Messagerie non autorisée pour ce rôle'));
        return;
      }
      socket.data.userId = payload.id;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.data.userId as number;
    socket.join(`user:${uid}`);

    socket.on(
      'send_message',
      async (payload: { recipientId: number; body: string }, cb?: (r: unknown) => void) => {
        try {
          const msg = await MessageService.send(uid, payload.recipientId, payload.body, io);
          cb?.({ ok: true, data: msg });
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : 'Erreur';
          cb?.({ ok: false, message });
        }
      }
    );
  });

  return io;
}
