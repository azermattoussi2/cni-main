// ============================================
// Fichier : utils/cv-parser.ts
// Description : Parsing CV basique (nom, email, école, niveau)
// ============================================
import fs from 'fs';
import { resolveStoredUploadPath } from './storage';

export type CvExtract = {
  cvNomExtrait?: string;
  cvEmailExtrait?: string;
  cvEcoleExtrait?: string;
  cvNiveauExtrait?: string;
};

export const parseCvBasic = (filePath?: string): CvExtract => {
  const resolved = filePath ? resolveStoredUploadPath(filePath) : null;
  if (!resolved) return {};
  const text = fs.readFileSync(resolved).toString('utf-8');
  const clean = text.replace(/\s+/g, ' ').trim();

  const email = clean.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const niveau = clean.match(/(Licence\s*[1-3]|Master\s*[1-2]|Ing[ée]nieur|Doctorat)/i)?.[0];
  const ecole = clean.match(/(ESPRIT|INSAT|ENIT|ISAMM|FST|ENISO|Université[\w\s-]+)/i)?.[0];

  // Heuristique simple: première ligne de 2-4 mots alphabétiques
  const nom = clean
    .split(/[,.:\n]/)
    .map((v) => v.trim())
    .find((line) => /^[A-Za-zÀ-ÿ'\-\s]{6,60}$/.test(line) && line.split(' ').length <= 4);

  return {
    cvNomExtrait: nom,
    cvEmailExtrait: email,
    cvEcoleExtrait: ecole,
    cvNiveauExtrait: niveau,
  };
};
