"use strict";
// ============================================
// Création / gestion des comptes employés par la Direction RH
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeRhService = void 0;
const models_1 = require("../models");
const error_middleware_1 = require("../middlewares/error.middleware");
const logger_1 = require("../config/logger");
const roles_1 = require("../constants/roles");
class EmployeRhService {
    static async createEmploye(data) {
        const rolesAutorises = [...roles_1.MANAGER_CREATABLE_ROLES];
        if (!rolesAutorises.includes(data.role)) {
            throw new error_middleware_1.AppError(400, 'Rôle non autorisé pour cette création (utilisez les comptes système pour la RH).');
        }
        if (roles_1.MANAGER_CREATABLE_ROLES.includes(data.role) && !data.departementId) {
            throw new error_middleware_1.AppError(400, 'Le département est obligatoire pour ce rôle.');
        }
        const dept = await models_1.Departement.findByPk(data.departementId);
        if (!dept)
            throw new error_middleware_1.AppError(404, 'Département introuvable.');
        const exists = await models_1.Employe.findOne({ where: { email: data.email.toLowerCase().trim() } });
        if (exists)
            throw new error_middleware_1.AppError(409, 'Un compte existe déjà avec cet e-mail.');
        const employe = await models_1.Employe.create({
            nom: data.nom.trim(),
            prenom: data.prenom.trim(),
            email: data.email.toLowerCase().trim(),
            motDePasse: data.password,
            role: data.role,
            departementId: data.departementId,
            poste: data.poste?.trim(),
            telephone: data.telephone?.trim(),
            isActif: true,
            isArchived: false,
        });
        if (data.role === 'Manager') {
            await dept.update({ responsableId: employe.id });
            logger_1.logger.info(`Département #${dept.id} : responsable (manager) défini sur employé #${employe.id}`);
        }
        const created = await models_1.Employe.findByPk(employe.id, {
            attributes: { exclude: ['motDePasse', 'refreshToken'] },
            include: [{ model: models_1.Departement, as: 'departement', attributes: ['id', 'nom', 'code', 'description'] }],
        });
        logger_1.logger.info(`👤 Compte créé par RH : ${employe.email} (${data.role})`);
        return created;
    }
    static async updateEmploye(id, data) {
        const e = await models_1.Employe.findByPk(id);
        if (!e)
            throw new error_middleware_1.AppError(404, 'Employé introuvable.');
        if (e.role === 'Direction_RH') {
            throw new error_middleware_1.AppError(400, 'Modification d’un compte RH via cette route non autorisée.');
        }
        const { motDePasse, ...rest } = data;
        if (Object.keys(rest).length)
            await e.update(rest);
        if (motDePasse)
            await e.update({ motDePasse });
        if (e.role === 'Manager' && data.departementId && data.departementId !== e.departementId) {
            const newDept = await models_1.Departement.findByPk(data.departementId);
            if (!newDept)
                throw new error_middleware_1.AppError(404, 'Nouveau département introuvable.');
            const oldDeptId = e.departementId;
            await e.update({ departementId: data.departementId });
            if (oldDeptId) {
                const oldD = await models_1.Departement.findByPk(oldDeptId);
                if (oldD?.responsableId === e.id)
                    await oldD.update({ responsableId: null });
            }
            await newDept.update({ responsableId: e.id });
        }
        return models_1.Employe.findByPk(id, {
            attributes: { exclude: ['motDePasse', 'refreshToken'] },
            include: [{ model: models_1.Departement, as: 'departement', attributes: ['id', 'nom', 'code', 'description'] }],
        });
    }
    static async setActif(id, isActif) {
        const e = await models_1.Employe.findByPk(id);
        if (!e)
            throw new error_middleware_1.AppError(404, 'Employé introuvable.');
        if (e.role === 'Direction_RH')
            throw new error_middleware_1.AppError(400, 'Action non autorisée sur un compte RH.');
        await e.update({ isActif });
        return { id: e.id, isActif };
    }
    static async setArchived(id, isArchived) {
        const e = await models_1.Employe.findByPk(id);
        if (!e)
            throw new error_middleware_1.AppError(404, 'Employé introuvable.');
        if (e.role === 'Direction_RH')
            throw new error_middleware_1.AppError(400, 'Action non autorisée sur un compte RH.');
        await e.update({
            isArchived,
            ...(isArchived ? { isActif: false } : {}),
        });
        return { id: e.id, isArchived };
    }
}
exports.EmployeRhService = EmployeRhService;
//# sourceMappingURL=employeRh.service.js.map