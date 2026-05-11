"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachSocket = attachSocket;
const socket_io_1 = require("socket.io");
const jwt_1 = require("../config/jwt");
const message_service_1 = require("../services/message.service");
const ioSingleton_1 = require("./ioSingleton");
const roles_1 = require("../constants/roles");
const MESSAGING_ROLES = [...roles_1.INTERNAL_STAFF_ROLES];
function attachSocket(httpServer) {
    const origin = process.env.FRONTEND_URL || 'http://localhost:5173';
    const io = new socket_io_1.Server(httpServer, {
        path: '/socket.io',
        cors: { origin, credentials: true },
    });
    (0, ioSingleton_1.setIo)(io);
    io.use((socket, next) => {
        try {
            const raw = socket.handshake.auth?.token ||
                (typeof socket.handshake.headers?.authorization === 'string'
                    ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
                    : undefined);
            if (!raw) {
                next(new Error('Auth requise'));
                return;
            }
            const payload = (0, jwt_1.verifyAccessToken)(raw);
            if (!(0, roles_1.isInternalStaffRole)(payload.role) || !MESSAGING_ROLES.includes(payload.role)) {
                next(new Error('Messagerie non autorisée pour ce rôle'));
                return;
            }
            socket.data.userId = payload.id;
            socket.data.role = payload.role;
            next();
        }
        catch {
            next(new Error('Token invalide'));
        }
    });
    io.on('connection', (socket) => {
        const uid = socket.data.userId;
        socket.join(`user:${uid}`);
        socket.on('send_message', async (payload, cb) => {
            try {
                const msg = await message_service_1.MessageService.send(uid, payload.recipientId, payload.body, io);
                cb?.({ ok: true, data: msg });
            }
            catch (e) {
                const message = e instanceof Error ? e.message : 'Erreur';
                cb?.({ ok: false, message });
            }
        });
    });
    return io;
}
//# sourceMappingURL=socketHub.js.map