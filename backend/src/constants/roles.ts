import type { RoleType } from '../models/Employe';

export const INTERNAL_STAFF_ROLES: ReadonlyArray<RoleType> = [
  'Direction_RH',
  'Manager',
  'Employe',
  'Formateur_Interne',
  'Formateur_Externe',
];

export const TEAM_MEMBER_ROLES: ReadonlyArray<RoleType> = [
  'Employe',
  'Formateur_Interne',
  'Formateur_Externe',
];

export const MANAGER_CREATABLE_ROLES: ReadonlyArray<RoleType> = [
  'Manager',
  'Employe',
  'Formateur_Interne',
  'Formateur_Externe',
];

export const PUBLIC_REGISTER_ROLES: ReadonlyArray<RoleType> = [
  'Employe',
  'Formateur_Interne',
  'Formateur_Externe',
];

export function isTeamMemberRole(role: string): role is RoleType {
  return TEAM_MEMBER_ROLES.includes(role as RoleType);
}

export function isInternalStaffRole(role: string): role is RoleType {
  return INTERNAL_STAFF_ROLES.includes(role as RoleType);
}
