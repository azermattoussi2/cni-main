// ============================================
// Création / gestion des comptes employés par la Direction RH
// ============================================

import { Employe, Departement } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { logger } from '../config/logger';
import type { RoleType } from '../models/Employe';
import { MANAGER_CREATABLE_ROLES } from '../constants/roles';

export class EmployeRhService {
  static async createEmploye(data: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    role: RoleType;
    departementId?: number;
    poste?: string;
    telephone?: string;
  }) {
    const rolesAutorises: RoleType[] = [...MANAGER_CREATABLE_ROLES];
    if (!rolesAutorises.includes(data.role)) {
      throw new AppError(400, 'Rôle non autorisé pour cette création (utilisez les comptes système pour la RH).');
    }

    if (MANAGER_CREATABLE_ROLES.includes(data.role) && !data.departementId) {
      throw new AppError(400, 'Le département est obligatoire pour ce rôle.');
    }

    const dept = await Departement.findByPk(data.departementId!);
    if (!dept) throw new AppError(404, 'Département introuvable.');

    const exists = await Employe.findOne({ where: { email: data.email.toLowerCase().trim() } });
    if (exists) throw new AppError(409, 'Un compte existe déjà avec cet e-mail.');

    const employe = await Employe.create({
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
      logger.info(`Département #${dept.id} : responsable (manager) défini sur employé #${employe.id}`);
    }

    const created = await Employe.findByPk(employe.id, {
      attributes: { exclude: ['motDePasse', 'refreshToken'] },
      include: [{ model: Departement, as: 'departement', attributes: ['id', 'nom', 'code', 'description'] }],
    });
    logger.info(`👤 Compte créé par RH : ${employe.email} (${data.role})`);
    return created;
  }

  static async updateEmploye(
    id: number,
    data: Partial<{
      nom: string;
      prenom: string;
      email: string;
      poste: string;
      telephone: string;
      departementId: number;
      motDePasse: string;
    }>
  ) {
    const e = await Employe.findByPk(id);
    if (!e) throw new AppError(404, 'Employé introuvable.');
    if (e.role === 'Direction_RH') {
      throw new AppError(400, 'Modification d’un compte RH via cette route non autorisée.');
    }

    const { motDePasse, ...rest } = data;
    if (Object.keys(rest).length) await e.update(rest);
    if (motDePasse) await e.update({ motDePasse });

    if (e.role === 'Manager' && data.departementId && data.departementId !== e.departementId) {
      const newDept = await Departement.findByPk(data.departementId);
      if (!newDept) throw new AppError(404, 'Nouveau département introuvable.');
      const oldDeptId = e.departementId;
      await e.update({ departementId: data.departementId });
      if (oldDeptId) {
        const oldD = await Departement.findByPk(oldDeptId);
        if (oldD?.responsableId === e.id) await oldD.update({ responsableId: null });
      }
      await newDept.update({ responsableId: e.id });
    }

    return Employe.findByPk(id, {
      attributes: { exclude: ['motDePasse', 'refreshToken'] },
      include: [{ model: Departement, as: 'departement', attributes: ['id', 'nom', 'code', 'description'] }],
    });
  }

  static async setActif(id: number, isActif: boolean) {
    const e = await Employe.findByPk(id);
    if (!e) throw new AppError(404, 'Employé introuvable.');
    if (e.role === 'Direction_RH') throw new AppError(400, 'Action non autorisée sur un compte RH.');
    await e.update({ isActif });
    return { id: e.id, isActif };
  }

  static async setArchived(id: number, isArchived: boolean) {
    const e = await Employe.findByPk(id);
    if (!e) throw new AppError(404, 'Employé introuvable.');
    if (e.role === 'Direction_RH') throw new AppError(400, 'Action non autorisée sur un compte RH.');
    await e.update({
      isArchived,
      ...(isArchived ? { isActif: false } : {}),
    });
    return { id: e.id, isArchived };
  }
}
