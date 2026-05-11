"use strict";
// ============================================
// Contrôle d'accès dossiers stagiaire (RH / Manager / Formateur référent)
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRh = isRh;
exports.isManager = isManager;
exports.isFormateur = isFormateur;
exports.assertCanAutomateStagiaire = assertCanAutomateStagiaire;
exports.assertProjectableStatut = assertProjectableStatut;
const error_middleware_1 = require("../middlewares/error.middleware");
function isRh(u) {
    return u.role === 'Direction_RH';
}
function isManager(u) {
    return u.role === 'Manager';
}
function isFormateur(u) {
    return u.role === 'Formateur_Interne' || u.role === 'Formateur_Externe';
}
/** Lecture / actions workflow : RH tout périmètre, Manager = département, Formateur = tuteur assigné */
async function assertCanAutomateStagiaire(user, s) {
    if (isRh(user))
        return;
    if (isManager(user)) {
        if (!user.departementId || Number(s.departementId) !== Number(user.departementId)) {
            throw new error_middleware_1.AppError(403, 'Accès réservé aux dossiers de votre département.');
        }
        return;
    }
    if (isFormateur(user) || user.role === 'Employe') {
        if (!s.tuteurId || Number(s.tuteurId) !== Number(user.id)) {
            throw new error_middleware_1.AppError(403, 'Accès réservé au tuteur / formateur référent du stagiaire.');
        }
        return;
    }
    throw new error_middleware_1.AppError(403, 'Rôle non autorisé pour cette action.');
}
function assertProjectableStatut(s) {
    if (!['Accepte', 'En_cours'].includes(s.statut)) {
        throw new error_middleware_1.AppError(400, 'Assignation de projet impossible : le dossier doit être accepté (ou stage en cours).');
    }
}
//# sourceMappingURL=stagiaireAccess.service.js.map