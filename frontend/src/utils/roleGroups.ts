import type { Role } from '../types';

export const INTERNAL_STAFF_ROLES: ReadonlyArray<Role> = [
  'Direction_RH',
  'Manager',
  'Employe',
  'Formateur_Interne',
  'Formateur_Externe',
];

export const STAGIAIRE_WORKFLOW_ROLES: ReadonlyArray<Role> = [
  'Direction_RH',
  'Manager',
  'Employe',
  'Formateur_Interne',
  'Formateur_Externe',
];

export const EMPLOYE_EQUIVALENT_ROLES: ReadonlyArray<Role> = [
  'Employe',
  'Formateur_Interne',
];

export const TUTEUR_ROLES: ReadonlyArray<Role> = [
  'Employe',
  'Formateur_Interne',
  'Formateur_Externe',
];

export function hasRole(role: Role | undefined, roles: ReadonlyArray<Role>) {
  return !!role && roles.includes(role);
}
