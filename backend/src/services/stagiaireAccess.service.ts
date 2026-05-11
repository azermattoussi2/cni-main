// ============================================
// Contrôle d'accès dossiers stagiaire (RH / Manager / Formateur référent)
// ============================================

import { Stagiaire } from '../models';
import { JwtPayload } from '../config/jwt';
import { AppError } from '../middlewares/error.middleware';

export type StagRow = InstanceType<typeof Stagiaire>;

export function isRh(u: JwtPayload) {
  return u.role === 'Direction_RH';
}
export function isManager(u: JwtPayload) {
  return u.role === 'Manager';
}
export function isFormateur(u: JwtPayload) {
  return u.role === 'Formateur_Interne' || u.role === 'Formateur_Externe';
}

/** Lecture / actions workflow : RH tout périmètre, Manager = département, Formateur = tuteur assigné */
export async function assertCanAutomateStagiaire(user: JwtPayload, s: StagRow) {
  if (isRh(user)) return;
  if (isManager(user)) {
    if (!user.departementId || Number(s.departementId) !== Number(user.departementId)) {
      throw new AppError(403, 'Accès réservé aux dossiers de votre département.');
    }
    return;
  }
  if (isFormateur(user) || user.role === 'Employe') {
    if (!s.tuteurId || Number(s.tuteurId) !== Number(user.id)) {
      throw new AppError(403, 'Accès réservé au tuteur / formateur référent du stagiaire.');
    }
    return;
  }
  throw new AppError(403, 'Rôle non autorisé pour cette action.');
}

export function assertProjectableStatut(s: StagRow) {
  if (!['Accepte', 'En_cours'].includes(s.statut)) {
    throw new AppError(400, 'Assignation de projet impossible : le dossier doit être accepté (ou stage en cours).');
  }
}
