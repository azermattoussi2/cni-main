"use strict";
// ============================================
// Messagerie interne (règles : RH↔Manager, Manager↔équipe même département)
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const error_middleware_1 = require("../middlewares/error.middleware");
const roles_1 = require("../constants/roles");
class MessageService {
    static async unreadCount(userId) {
        return models_1.Message.count({
            where: {
                recipientId: userId,
                readAt: null,
            },
        });
    }
    static async markThreadRead(actorId, otherUserId) {
        const actor = await models_1.Employe.findByPk(actorId);
        const other = await models_1.Employe.findByPk(otherUserId);
        if (!actor || !other)
            throw new error_middleware_1.AppError(404, 'Utilisateur introuvable.');
        await MessageService.assertCanMessage(actor, other);
        await models_1.Message.update({ readAt: new Date() }, {
            where: {
                senderId: otherUserId,
                recipientId: actorId,
                readAt: null,
            },
        });
    }
    /** Vérifie que l’expéditeur peut écrire au destinataire */
    static async assertCanMessage(sender, recipient) {
        if (!recipient.isActif)
            throw new error_middleware_1.AppError(400, 'Destinataire inactif.');
        if (sender.id === recipient.id)
            throw new error_middleware_1.AppError(400, 'Impossible de vous écrire à vous-même.');
        const sRole = sender.role;
        const rRole = recipient.role;
        if (sRole === 'Direction_RH') {
            if (rRole === 'Manager')
                return;
            throw new error_middleware_1.AppError(403, 'La RH ne peut démarrer une conversation qu’avec un manager.');
        }
        if (sRole === 'Manager') {
            if (rRole === 'Direction_RH')
                return;
            if (sender.departementId &&
                recipient.departementId === sender.departementId &&
                roles_1.TEAM_MEMBER_ROLES.includes(rRole)) {
                return;
            }
            throw new error_middleware_1.AppError(403, 'Vous ne pouvez écrire qu’à la RH ou aux membres de votre département.');
        }
        if (roles_1.TEAM_MEMBER_ROLES.includes(sRole)) {
            if (rRole === 'Direction_RH')
                return;
            if (rRole === 'Manager' &&
                sender.departementId &&
                recipient.departementId === sender.departementId) {
                return;
            }
            throw new error_middleware_1.AppError(403, 'Vous ne pouvez écrire qu’à votre manager ou à la RH.');
        }
        throw new error_middleware_1.AppError(403, 'Messagerie non autorisée pour votre rôle.');
    }
    static async listContacts(actorId, role) {
        const actor = await models_1.Employe.findByPk(actorId, {
            include: [{ model: models_1.Departement, as: 'departement', attributes: ['id', 'nom', 'code'] }],
        });
        if (!actor)
            throw new error_middleware_1.AppError(404, 'Utilisateur introuvable.');
        if (role === 'Direction_RH') {
            return models_1.Employe.findAll({
                where: { role: 'Manager', isActif: true },
                attributes: ['id', 'nom', 'prenom', 'email', 'poste', 'role', 'departementId'],
                include: [{ model: models_1.Departement, as: 'departement', attributes: ['id', 'nom', 'code'] }],
                order: [['nom', 'ASC']],
            });
        }
        if (role === 'Manager') {
            const rh = await models_1.Employe.findAll({
                where: { role: 'Direction_RH', isActif: true },
                attributes: ['id', 'nom', 'prenom', 'email', 'poste', 'role'],
            });
            const equipe = actor.departementId != null
                ? await models_1.Employe.findAll({
                    where: {
                        departementId: actor.departementId,
                        id: { [sequelize_1.Op.ne]: actorId },
                        isActif: true,
                        role: { [sequelize_1.Op.in]: roles_1.TEAM_MEMBER_ROLES },
                    },
                    attributes: ['id', 'nom', 'prenom', 'email', 'poste', 'role'],
                    order: [['nom', 'ASC']],
                })
                : [];
            const map = new Map();
            [...rh, ...equipe].forEach((e) => map.set(e.id, e));
            return [...map.values()];
        }
        if (roles_1.TEAM_MEMBER_ROLES.includes(role)) {
            const rh = await models_1.Employe.findAll({
                where: { role: 'Direction_RH', isActif: true },
                attributes: ['id', 'nom', 'prenom', 'email', 'poste', 'role'],
            });
            const mgr = actor.departementId != null
                ? await models_1.Employe.findOne({
                    where: {
                        role: 'Manager',
                        departementId: actor.departementId,
                        isActif: true,
                    },
                    attributes: ['id', 'nom', 'prenom', 'email', 'poste', 'role'],
                })
                : null;
            return mgr ? [...rh, mgr] : rh;
        }
        return [];
    }
    static async listThread(actorId, otherUserId, limit = 100) {
        const actor = await models_1.Employe.findByPk(actorId);
        const other = await models_1.Employe.findByPk(otherUserId);
        if (!actor || !other)
            throw new error_middleware_1.AppError(404, 'Utilisateur introuvable.');
        await MessageService.assertCanMessage(actor, other);
        const rows = await models_1.Message.findAll({
            where: {
                [sequelize_1.Op.or]: [
                    { senderId: actorId, recipientId: otherUserId },
                    { senderId: otherUserId, recipientId: actorId },
                ],
            },
            order: [['createdAt', 'ASC']],
            limit,
            include: [
                { model: models_1.Employe, as: 'sender', attributes: ['id', 'nom', 'prenom', 'role'] },
                { model: models_1.Employe, as: 'recipient', attributes: ['id', 'nom', 'prenom', 'role'] },
            ],
        });
        return rows;
    }
    static async send(actorId, recipientId, body, io) {
        const trimmed = body?.trim();
        if (!trimmed)
            throw new error_middleware_1.AppError(400, 'Message vide.');
        if (trimmed.length > 8000)
            throw new error_middleware_1.AppError(400, 'Message trop long (8000 caractères max).');
        const sender = await models_1.Employe.findByPk(actorId);
        const recipient = await models_1.Employe.findByPk(recipientId);
        if (!sender || !recipient)
            throw new error_middleware_1.AppError(404, 'Utilisateur introuvable.');
        await MessageService.assertCanMessage(sender, recipient);
        const msg = await models_1.Message.create({
            senderId: actorId,
            recipientId,
            body: trimmed,
        });
        const full = await models_1.Message.findByPk(msg.id, {
            include: [
                { model: models_1.Employe, as: 'sender', attributes: ['id', 'nom', 'prenom', 'role'] },
                { model: models_1.Employe, as: 'recipient', attributes: ['id', 'nom', 'prenom', 'role'] },
            ],
        });
        const payload = full?.toJSON();
        if (io && payload) {
            io.to(`user:${recipientId}`).emit('new_message', payload);
            io.to(`user:${actorId}`).emit('new_message', payload);
        }
        return full;
    }
}
exports.MessageService = MessageService;
//# sourceMappingURL=message.service.js.map