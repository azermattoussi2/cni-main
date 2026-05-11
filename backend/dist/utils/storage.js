"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveUploadPath = exports.buildPublicFileUrl = void 0;
exports.resolveStoredUploadPath = resolveStoredUploadPath;
// ============================================
// Fichier : utils/storage.ts
// Description : Stockage local + simulation S3
// ============================================
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const buildPublicFileUrl = (localPath) => {
    if (!localPath)
        return undefined;
    const normalized = localPath.replace(/\\/g, '/');
    if (process.env.STORAGE_DRIVER === 's3') {
        return `${process.env.S3_MOCK_BASE_URL || 'https://s3.mock.cni.local'}/${normalized}`;
    }
    return `/${normalized}`;
};
exports.buildPublicFileUrl = buildPublicFileUrl;
const resolveUploadPath = (filename, folder) => path_1.default.join(process.env.UPLOAD_DIR || 'uploads', folder, filename);
exports.resolveUploadPath = resolveUploadPath;
/**
 * Retrouve un fichier uploadé sur le disque (chemin absolu ou relatif, CWD variable, build dist/).
 */
function resolveStoredUploadPath(stored) {
    if (!stored || typeof stored !== 'string')
        return null;
    const t = stored.trim();
    if (!t)
        return null;
    const asPosix = t.replace(/\\/g, '/');
    let relativeLike = asPosix;
    if (relativeLike.startsWith('/uploads/')) {
        relativeLike = relativeLike.slice(1);
    }
    const tryPaths = new Set();
    const add = (p) => {
        if (!p)
            return;
        try {
            tryPaths.add(path_1.default.normalize(p));
        }
        catch {
            /* */
        }
    };
    add(t);
    if (!path_1.default.isAbsolute(t)) {
        add(path_1.default.resolve(process.cwd(), t));
        add(path_1.default.resolve(process.cwd(), relativeLike));
    }
    const roots = [path_1.default.resolve(__dirname, '..', '..'), path_1.default.resolve(__dirname, '..')];
    for (const root of roots) {
        add(path_1.default.join(root, relativeLike));
        add(path_1.default.join(root, t));
        add(path_1.default.join(root, relativeLike.replace(/^\/+/, '')));
    }
    for (const candidate of tryPaths) {
        try {
            if (fs_1.default.existsSync(candidate) && fs_1.default.statSync(candidate).isFile()) {
                return candidate;
            }
        }
        catch {
            /* */
        }
    }
    return null;
}
//# sourceMappingURL=storage.js.map