// ============================================
// Fichier : middlewares/upload.middleware.ts
// Description : Gestion upload fichiers avec Multer
// ============================================

import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import crypto from 'crypto';

// Créer les dossiers d'upload si inexistants
const uploadDirs = ['uploads', 'uploads/cv', 'uploads/conventions', 'uploads/attestations', 'uploads/supports', 'uploads/avatars'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Configuration stockage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    let folder = 'uploads';
    const fieldname = file.fieldname;

    if (fieldname === 'cv' || fieldname === 'lettreMotivation') folder = 'uploads/cv';
    else if (fieldname === 'convention') folder = 'uploads/conventions';
    else if (fieldname === 'attestation') folder = 'uploads/attestations';
    else if (fieldname === 'support') folder = 'uploads/supports';
    else if (fieldname === 'avatar') folder = 'uploads/avatars';

    cb(null, folder);
  },
  filename: (_req, file, cb) => {
    // Nom unique : uuid + extension originale
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

// Filtre : n'accepter que PDF, images, et documents Office
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'cv' && !['.pdf', '.docx', '.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
    cb(new Error('Le CV doit être au format PDF, DOCX ou image (JPG, PNG, WebP).'));
    return;
  }

  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non autorisé : ${ext}. Formats acceptés : PDF, DOC, DOCX, JPG, PNG`));
  }
};

// Upload simple (1 fichier)
export const uploadSingle = (fieldName: string) =>
  multer({
    storage,
    fileFilter,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
  }).single(fieldName);

// Upload multiple (plusieurs champs)
export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') },
}).fields([
  { name: 'cv', maxCount: 1 },
  { name: 'lettreMotivation', maxCount: 1 },
  { name: 'convention', maxCount: 1 },
]);

// Supprimer un fichier uploadé
export const deleteFile = (filePath: string): void => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};
