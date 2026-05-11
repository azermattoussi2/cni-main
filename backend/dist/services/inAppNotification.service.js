"use strict";
// ============================================
// Agrégation légère des « notifications » in-app (pas de table dédiée)
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.InAppNotificationService = void 0;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const roles_1 = require("../constants/roles");
const message_service_1 = require("./message.service");
class InAppNotificationService {
    static async list(userId, role) {
        const items = [];
        const unreadMessages = await message_service_1.MessageService.unreadCount(userId);
        if (unreadMessages > 0) {
            items.push({
                id: 'msg-unread',
                title: `${unreadMessages} nouveau(x) message(s)`,
                description: 'Ouvrez la messagerie pour lire et répondre.',
                href: '/app/messages',
                kind: 'info',
            });
        }
        if (role === 'Direction_RH') {
            const cand = await models_1.Stagiaire.count({
                where: { statut: { [sequelize_1.Op.in]: ['En_attente', 'En_examen'] } },
            });
            if (cand > 0) {
                items.push({
                    id: 'rh-stages-attente',
                    title: `${cand} candidature(s) stage à traiter`,
                    description: 'Des candidatures nécessitent une décision.',
                    href: '/app/stagiaires',
                    kind: 'warning',
                });
            }
            const insRH = await models_1.InscriptionFormation.count({ where: { statut: 'En_attente_RH' } });
            if (insRH > 0) {
                items.push({
                    id: 'rh-form-rh',
                    title: `${insRH} inscription(s) en attente RH`,
                    description: 'Validez ou refusez dans Validations inscriptions.',
                    href: '/app/formations/validations',
                    kind: 'warning',
                });
            }
            return items;
        }
        if (role === 'Manager') {
            const mgr = await models_1.Employe.findByPk(userId);
            if (mgr?.departementId) {
                const rows = await models_1.InscriptionFormation.findAll({
                    attributes: ['id'],
                    where: { statut: 'En_attente_manager' },
                    include: [
                        {
                            model: models_1.Employe,
                            as: 'employe',
                            where: { departementId: mgr.departementId },
                            required: true,
                            attributes: [],
                        },
                    ],
                });
                const n = rows.length;
                if (n > 0) {
                    items.push({
                        id: 'mgr-insc',
                        title: `${n} demande(s) d’inscription à valider`,
                        description: 'Collaborateurs de votre département — étape manager.',
                        href: '/app/formations/validations',
                        kind: 'warning',
                    });
                }
            }
            return items;
        }
        if (role === 'Formateur_Interne') {
            const d = await models_1.DemandeFormateur.count({
                where: { formateurId: userId, statut: 'En_attente' },
            });
            if (d > 0) {
                items.push({
                    id: 'fi-demandes',
                    title: `${d} opportunité(s) formateur en attente`,
                    description: 'Répondez depuis votre tableau de bord formateur.',
                    href: '/app/dashboard',
                    kind: 'warning',
                });
            }
        }
        if (roles_1.TEAM_MEMBER_ROLES.includes(role)) {
            const pending = await models_1.InscriptionFormation.count({
                where: {
                    employeId: userId,
                    statut: { [sequelize_1.Op.in]: ['En_attente_manager', 'En_attente_RH'] },
                },
            });
            if (pending > 0) {
                items.push({
                    id: 'perso-ins',
                    title: `${pending} demande(s) de formation en cours`,
                    description: 'Votre demande est en cours de validation.',
                    href: '/app/formations',
                    kind: 'info',
                });
            }
        }
        if (role === 'Stagiaire') {
            const s = await models_1.Stagiaire.findByPk(userId);
            if (s && (s.statut === 'En_attente' || s.statut === 'En_examen')) {
                items.push({
                    id: 'st-cand',
                    title: 'Candidature en cours d’examen',
                    description: 'Vous serez notifié par e-mail de la décision.',
                    href: '/app/dashboard',
                    kind: 'info',
                });
            }
        }
        return items;
    }
}
exports.InAppNotificationService = InAppNotificationService;
//# sourceMappingURL=inAppNotification.service.js.map