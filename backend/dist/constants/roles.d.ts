import type { RoleType } from '../models/Employe';
export declare const INTERNAL_STAFF_ROLES: ReadonlyArray<RoleType>;
export declare const TEAM_MEMBER_ROLES: ReadonlyArray<RoleType>;
export declare const MANAGER_CREATABLE_ROLES: ReadonlyArray<RoleType>;
export declare const PUBLIC_REGISTER_ROLES: ReadonlyArray<RoleType>;
export declare function isTeamMemberRole(role: string): role is RoleType;
export declare function isInternalStaffRole(role: string): role is RoleType;
//# sourceMappingURL=roles.d.ts.map