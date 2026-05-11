"use strict";
// ============================================
// Création / gestion des comptes par le Manager (même département uniquement)
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeManagerService = void 0;
const models_1 = require("../models");
const error_middleware_1 = require("../middlewares/error.middleware");
const employeRh_service_1 = require("./employeRh.service");
const roles_1 = require("../constants/roles");
class EmployeManagerService {
    static async assertManagerScope(managerId, targetId) {
        const mgr = await models_1.Employe.findByPk(managerId);
        if (!mgr || mgr.role !== 'Manager') {
            throw new error_middleware_1.AppError(403, 'Réservé aux managers.');
        }
        if (!mgr.departementId) {
            throw new error_middleware_1.AppError(400, 'Aucun département rattaché à votre compte manager.');
        }
        const target = await models_1.Employe.findByPk(targetId);
        if (!target)
            throw new error_middleware_1.AppError(404, 'Employé introuvable.');
        if (target.role === 'Direction_RH') {
            throw new error_middleware_1.AppError(403, 'Action non autorisée sur ce compte.');
        }
        if (target.departementId !== mgr.departementId) {
            throw new error_middleware_1.AppError(403, 'Cet employé n’appartient pas à votre département.');
        }
        return mgr;
    }
    static async createEmploye(managerId, data) {
        const mgr = await models_1.Employe.findByPk(managerId);
        if (!mgr || mgr.role !== 'Manager') {
            throw new error_middleware_1.AppError(403, 'Réservé aux managers.');
        }
        if (!mgr.departementId) {
            throw new error_middleware_1.AppError(400, 'Aucun département rattaché à votre compte manager.');
        }
        const rolesAutorises = [...roles_1.MANAGER_CREATABLE_ROLES];
        if (!rolesAutorises.includes(data.role)) {
            throw new error_middleware_1.AppError(400, 'Rôle non autorisé.');
        }
        return employeRh_service_1.EmployeRhService.createEmploye({
            ...data,
            departementId: mgr.departementId,
        });
    }
    static async updateEmploye(managerId, targetId, data) {
        await EmployeManagerService.assertManagerScope(managerId, targetId);
        if (data.departementId != null) {
            const mgr = await models_1.Employe.findByPk(managerId);
            if (data.departementId !== mgr.departementId) {
                throw new error_middleware_1.AppError(403, 'Vous ne pouvez pas déplacer un employé hors de votre département.');
            }
        }
        return employeRh_service_1.EmployeRhService.updateEmploye(targetId, data);
    }
    static async setActif(managerId, targetId, isActif) {
        await EmployeManagerService.assertManagerScope(managerId, targetId);
        if (targetId === managerId && !isActif) {
            throw new error_middleware_1.AppError(400, 'Vous ne pouvez pas désactiver votre propre compte depuis cette interface.');
        }
        return employeRh_service_1.EmployeRhService.setActif(targetId, isActif);
    }
    static async setArchived(managerId, targetId, isArchived) {
        await EmployeManagerService.assertManagerScope(managerId, targetId);
        if (targetId === managerId && isArchived) {
            throw new error_middleware_1.AppError(400, 'Vous ne pouvez pas archiver votre propre compte.');
        }
        return employeRh_service_1.EmployeRhService.setArchived(targetId, isArchived);
    }
}
exports.EmployeManagerService = EmployeManagerService;
//# sourceMappingURL=employeManager.service.js.map