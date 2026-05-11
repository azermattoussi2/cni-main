// ============================================
// Fichier : utils/storage.ts
// Description : Stockage local + simulation S3
// ============================================
import fs from 'fs';
import path from 'path';

export const buildPublicFileUrl = (localPath?: string): string | undefined => {
  if (!localPath) return undefined;
  const normalized = localPath.replace(/\\/g, '/');
  if (process.env.STORAGE_DRIVER === 's3') {
    return `${process.env.S3_MOCK_BASE_URL || 'https://s3.mock.cni.local'}/${normalized}`;
  }
  return `/${normalized}`;
};

export const resolveUploadPath = (filename: string, folder: string): string =>
  path.join(process.env.UPLOAD_DIR || 'uploads', folder, filename);

/**
 * Retrouve un fichier uploadé sur le disque (chemin absolu ou relatif, CWD variable, build dist/).
 */
export function resolveStoredUploadPath(stored?: string | null): string | null {
  if (!stored || typeof stored !== 'string') return null;
  const t = stored.trim();
  if (!t) return null;

  const asPosix = t.replace(/\\/g, '/');
  let relativeLike = asPosix;
  if (relativeLike.startsWith('/uploads/')) {
    relativeLike = relativeLike.slice(1);
  }

  const tryPaths = new Set<string>();
  const add = (p: string) => {
    if (!p) return;
    try {
      tryPaths.add(path.normalize(p));
    } catch {
      /* */
    }
  };

  add(t);

  if (!path.isAbsolute(t)) {
    add(path.resolve(process.cwd(), t));
    add(path.resolve(process.cwd(), relativeLike));
  }

  const roots = [path.resolve(__dirname, '..', '..'), path.resolve(__dirname, '..')];
  for (const root of roots) {
    add(path.join(root, relativeLike));
    add(path.join(root, t));
    add(path.join(root, relativeLike.replace(/^\/+/, '')));
  }

  for (const candidate of tryPaths) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    } catch {
      /* */
    }
  }
  return null;
}
