// ============================================
// Messagerie interne (règles : RH↔Manager, Manager↔équipe même département)
// ============================================

import { Op } from 'sequelize';
import { Employe, Message, Departement } from '../models';
import { AppError } from '../middlewares/error.middleware';
import type { Server as IOServer } from 'socket.io';
import { TEAM_MEMBER_ROLES } from '../constants/roles';

export class MessageService {
  static async unreadCount(userId: number) {
    return Message.count({
      where: {
        recipientId: userId,
        readAt: null,
      },
    });
  }

  static async markThreadRead(actorId: number, otherUserId: number) {
    const actor = await Employe.findByPk(actorId);
    const other = await Employe.findByPk(otherUserId);
    if (!actor || !other) throw new AppError(404, 'Utilisateur introuvable.');
    await MessageService.assertCanMessage(actor, other);
    await Message.update(
      { readAt: new Date() },
      {
        where: {
          senderId: otherUserId,
          recipientId: actorId,
          readAt: null,
        },
      }
    );
  }

  /** Vérifie que l’expéditeur peut écrire au destinataire */
  static async assertCanMessage(sender: Employe, recipient: Employe): Promise<void> {
    if (!recipient.isActif) throw new AppError(400, 'Destinataire inactif.');
    if (sender.id === recipient.id) throw new AppError(400, 'Impossible de vous écrire à vous-même.');

    const sRole = sender.role;
    const rRole = recipient.role;

    if (sRole === 'Direction_RH') {
      if (rRole === 'Manager') return;
      throw new AppError(403, 'La RH ne peut démarrer une conversation qu’avec un manager.');
    }

    if (sRole === 'Manager') {
      if (rRole === 'Direction_RH') return;
      if (
        sender.departementId &&
        recipient.departementId === sender.departementId &&
        TEAM_MEMBER_ROLES.includes(rRole as typeof TEAM_MEMBER_ROLES[number])
      ) {
        return;
      }
      throw new AppError(403, 'Vous ne pouvez écrire qu’à la RH ou aux membres de votre département.');
    }

    if (TEAM_MEMBER_ROLES.includes(sRole as typeof TEAM_MEMBER_ROLES[number])) {
      if (rRole === 'Direction_RH') return;
      if (
        rRole === 'Manager' &&
        sender.departementId &&
        recipient.departementId === sender.departementId
      ) {
        return;
      }
      throw new AppError(403, 'Vous ne pouvez écrire qu’à votre manager ou à la RH.');
    }

    throw new AppError(403, 'Messagerie non autorisée pour votre rôle.');
  }

  static async listContacts(actorId: number, role: string) {
    const actor = await Employe.findByPk(actorId, {
      include: [{ model: Departement, as: 'departement', attributes: ['id', 'nom', 'code'] }],
    });
    if (!actor) throw new AppError(404, 'Utilisateur introuvable.');

    if (role === 'Direction_RH') {
      return Employe.findAll({
        where: { role: 'Manager', isActif: true },
        attributes: ['id', 'nom', 'prenom', 'email', 'poste', 'role', 'departementId'],
        include: [{ model: Departement, as: 'departement', attributes: ['id', 'nom', 'code'] }],
        order: [['nom', 'ASC']],
      });
    }

    if (role === 'Manager') {
      const rh = await Employe.findAll({
        where: { role: 'Direction_RH', isActif: true },
        attributes: ['id', 'nom', 'prenom', 'email', 'poste', 'role'],
      });
      const equipe =
        actor.departementId != null
          ? await Employe.findAll({
              where: {
                departementId: actor.departementId,
                id: { [Op.ne]: actorId },
                isActif: true,
                role: { [Op.in]: TEAM_MEMBER_ROLES },
              },
              attributes: ['id', 'nom', 'prenom', 'email', 'poste', 'role'],
              order: [['nom', 'ASC']],
            })
          : [];
      const map = new Map<number, Employe>();
      [...rh, ...equipe].forEach((e) => map.set(e.id, e));
      return [...map.values()];
    }

    if (TEAM_MEMBER_ROLES.includes(role as typeof TEAM_MEMBER_ROLES[number])) {
      const rh = await Employe.findAll({
        where: { role: 'Direction_RH', isActif: true },
        attributes: ['id', 'nom', 'prenom', 'email', 'poste', 'role'],
      });
      const mgr =
        actor.departementId != null
          ? await Employe.findOne({
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

  static async listThread(actorId: number, otherUserId: number, limit = 100) {
    const actor = await Employe.findByPk(actorId);
    const other = await Employe.findByPk(otherUserId);
    if (!actor || !other) throw new AppError(404, 'Utilisateur introuvable.');
    await MessageService.assertCanMessage(actor, other);

    const rows = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: actorId, recipientId: otherUserId },
          { senderId: otherUserId, recipientId: actorId },
        ],
      },
      order: [['createdAt', 'ASC']],
      limit,
      include: [
        { model: Employe, as: 'sender', attributes: ['id', 'nom', 'prenom', 'role'] },
        { model: Employe, as: 'recipient', attributes: ['id', 'nom', 'prenom', 'role'] },
      ],
    });
    return rows;
  }

  static async send(actorId: number, recipientId: number, body: string, io?: IOServer) {
    const trimmed = body?.trim();
    if (!trimmed) throw new AppError(400, 'Message vide.');
    if (trimmed.length > 8000) throw new AppError(400, 'Message trop long (8000 caractères max).');

    const sender = await Employe.findByPk(actorId);
    const recipient = await Employe.findByPk(recipientId);
    if (!sender || !recipient) throw new AppError(404, 'Utilisateur introuvable.');
    await MessageService.assertCanMessage(sender, recipient);

    const msg = await Message.create({
      senderId: actorId,
      recipientId,
      body: trimmed,
    });

    const full = await Message.findByPk(msg.id, {
      include: [
        { model: Employe, as: 'sender', attributes: ['id', 'nom', 'prenom', 'role'] },
        { model: Employe, as: 'recipient', attributes: ['id', 'nom', 'prenom', 'role'] },
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
