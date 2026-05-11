import type { Role } from '../types';
import { EMPLOYE_EQUIVALENT_ROLES } from './roleGroups';

/** Profils (table employes) pouvant demander une inscription au catalogue comme un salarié. */
const SELF_ENROLL_FORMATION_ROLES: ReadonlyArray<Role> = [...EMPLOYE_EQUIVALENT_ROLES, 'Formateur_Externe'];

export function canSelfEnrollFormation(role: Role | string | undefined | null): boolean {
  if (!role) return false;
  return (SELF_ENROLL_FORMATION_ROLES as readonly string[]).includes(role);
}

/** État d’affichage côté employé pour le bouton d’inscription (indépendant du workflow métier détaillé). */
export type FormationEnrollmentUiKind = 'none' | 'pending' | 'accepted' | 'rejected';

export function mapInscriptionStatutToUi(statut: string | undefined | null): FormationEnrollmentUiKind {
  if (!statut) return 'none';
  if (statut === 'Validee' || statut === 'Terminee') return 'accepted';
  if (statut === 'Refusee' || statut === 'Annulee') return 'rejected';
  if (['En_attente_manager', 'En_attente_RH', 'Liste_attente'].includes(statut)) return 'pending';
  return 'pending';
}
