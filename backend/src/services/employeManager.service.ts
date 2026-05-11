// ============================================
// Création / gestion des comptes par le Manager (même département uniquement)
// ============================================

import { Employe } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { EmployeRhService } from './employeRh.service';
import type { RoleType } from '../models/Employe';
import { MANAGER_CREATABLE_ROLES } from '../constants/roles';

export class EmployeManagerService {
  private static async assertManagerScope(managerId: number, targetId: number): Promise<Employe> {
    const mgr = await Employe.findByPk(managerId);
    if (!mgr || mgr.role !== 'Manager') {
      throw new AppError(403, 'Réservé aux managers.');
    }
    if (!mgr.departementId) {
      throw new AppError(400, 'Aucun département rattaché à votre compte manager.');
    }
    const target = await Employe.findByPk(targetId);
    if (!target) throw new AppError(404, 'Employé introuvable.');
    if (target.role === 'Direction_RH') {
      throw new AppError(403, 'Action non autorisée sur ce compte.');
    }
    if (target.departementId !== mgr.departementId) {
      throw new AppError(403, 'Cet employé n’appartient pas à votre département.');
    }
    return mgr;
  }

  static async createEmploye(
    managerId: number,
    data: {
      nom: string;
      prenom: string;
      email: string;
      password: string;
      role: RoleType;
      poste?: string;
      telephone?: string;
    }
  ) {
    const mgr = await Employe.findByPk(managerId);
    if (!mgr || mgr.role !== 'Manager') {
      throw new AppError(403, 'Réservé aux managers.');
    }
    if (!mgr.departementId) {
      throw new AppError(400, 'Aucun département rattaché à votre compte manager.');
    }
    const rolesAutorises: RoleType[] = [...MANAGER_CREATABLE_ROLES];
    if (!rolesAutorises.includes(data.role)) {
      throw new AppError(400, 'Rôle non autorisé.');
    }
    return EmployeRhService.createEmploye({
      ...data,
      departementId: mgr.departementId,
    });
  }

  static async updateEmploye(
    managerId: number,
    targetId: number,
    data: Partial<{
      nom: string;
      prenom: string;
      email: string;
      poste: string;
      telephone: string;
      motDePasse: string;
      departementId: number;
    }>
  ) {
    await EmployeManagerService.assertManagerScope(managerId, targetId);
    if (data.departementId != null) {
      const mgr = await Employe.findByPk(managerId);
      if (data.departementId !== mgr!.departementId) {
        throw new AppError(403, 'Vous ne pouvez pas déplacer un employé hors de votre département.');
      }
    }
    return EmployeRhService.updateEmploye(targetId, data);
  }

  static async setActif(managerId: number, targetId: number, isActif: boolean) {
    await EmployeManagerService.assertManagerScope(managerId, targetId);
    if (targetId === managerId && !isActif) {
      throw new AppError(400, 'Vous ne pouvez pas désactiver votre propre compte depuis cette interface.');
    }
    return EmployeRhService.setActif(targetId, isActif);
  }

  static async setArchived(managerId: number, targetId: number, isArchived: boolean) {
    await EmployeManagerService.assertManagerScope(managerId, targetId);
    if (targetId === managerId && isArchived) {
      throw new AppError(400, 'Vous ne pouvez pas archiver votre propre compte.');
    }
    return EmployeRhService.setArchived(targetId, isArchived);
  }
}
