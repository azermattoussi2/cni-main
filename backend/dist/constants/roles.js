"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUBLIC_REGISTER_ROLES = exports.MANAGER_CREATABLE_ROLES = exports.TEAM_MEMBER_ROLES = exports.INTERNAL_STAFF_ROLES = void 0;
exports.isTeamMemberRole = isTeamMemberRole;
exports.isInternalStaffRole = isInternalStaffRole;
exports.INTERNAL_STAFF_ROLES = [
    'Direction_RH',
    'Manager',
    'Employe',
    'Formateur_Interne',
    'Formateur_Externe',
];
exports.TEAM_MEMBER_ROLES = [
    'Employe',
    'Formateur_Interne',
    'Formateur_Externe',
];
exports.MANAGER_CREATABLE_ROLES = [
    'Manager',
    'Employe',
    'Formateur_Interne',
    'Formateur_Externe',
];
exports.PUBLIC_REGISTER_ROLES = [
    'Employe',
    'Formateur_Interne',
    'Formateur_Externe',
];
function isTeamMemberRole(role) {
    return exports.TEAM_MEMBER_ROLES.includes(role);
}
function isInternalStaffRole(role) {
    return exports.INTERNAL_STAFF_ROLES.includes(role);
}
//# sourceMappingURL=roles.js.map