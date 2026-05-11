"use strict";
// ============================================
// Fichier : middlewares/upload.middleware.ts
// Description : Gestion upload fichiers avec Multer
// ============================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.uploadMultiple = exports.uploadSingle = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
// Créer les dossiers d'upload si inexistants
const uploadDirs = ['uploads', 'uploads/cv', 'uploads/conventions', 'uploads/attestations', 'uploads/supports', 'uploads/avatars'];
uploadDirs.forEach(dir => {
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
});
// Configuration stockage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'uploads';
        const fieldname = file.fieldname;
        if (fieldname === 'cv' || fieldname === 'lettreMotivation')
            folder = 'uploads/cv';
        else if (fieldname === 'convention')
            folder = 'uploads/conventions';
        else if (fieldname === 'attestation')
            folder = 'uploads/attestations';
        else if (fieldname === 'support')
            folder = 'uploads/supports';
        else if (fieldname === 'avatar')
            folder = 'uploads/avatars';
        cb(null, folder);
    },
    filename: (_req, file, cb) => {
        // Nom unique : uuid + extension originale
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        cb(null, `${crypto_1.default.randomUUID()}${ext}`);
    },
});
// Filtre : n'accepter que PDF, images, et documents Office
const fileFilter = (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (file.fieldname === 'cv' && !['.pdf', '.docx', '.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        cb(new Error('Le CV doit être au format PDF, DOCX ou image (JPG, PNG, WebP).'));
        return;
    }
    if (allowed.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Type de fichier non autorisé : ${ext}. Formats acceptés : PDF, DOC, DOCX, JPG, PNG`));
    }
};
// Upload simple (1 fichier)
const uploadSingle = (fieldName) => (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
}).single(fieldName);
exports.uploadSingle = uploadSingle;
// Upload multiple (plusieurs champs)
exports.uploadMultiple = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
}).fields([
    { name: 'cv', maxCount: 1 },
    { name: 'lettreMotivation', maxCount: 1 },
    { name: 'convention', maxCount: 1 },
]);
// Supprimer un fichier uploadé
const deleteFile = (filePath) => {
    if (fs_1.default.existsSync(filePath)) {
        fs_1.default.unlinkSync(filePath);
    }
};
exports.deleteFile = deleteFile;
//# sourceMappingURL=upload.middleware.js.map