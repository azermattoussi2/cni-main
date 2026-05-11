"use strict";
// ============================================
// Assistance rédaction / analyse d'évaluation (Google Gemini)
// Clé : GEMINI_API_KEY dans .env — ne jamais commiter la clé
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.suggestEvaluationReport = suggestEvaluationReport;
exports.suggestProjectTitleFromCv = suggestProjectTitleFromCv;
const error_middleware_1 = require("../middlewares/error.middleware");
async function suggestEvaluationReport(params) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        throw new error_middleware_1.AppError(503, 'Assistant IA non configuré (GEMINI_API_KEY manquante).');
    }
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    const prompt = `Tu es un assistant RH expert pour un centre public informatique (CNI, Tunisie).
Le tuteur a saisi des notes sur un stagiaire (${params.stagiairePrenom} ${params.stagiaireNom}).
Type d'évaluation : ${params.type}.
Produis un rapport structuré en français professionnel avec les sections :
1) Synthèse
2) Points forts
3) Axes de progression
4) Recommandations
Base-toi uniquement sur les notes ci-dessous (ne invente pas de faits).

Notes du tuteur :
${params.notesTuteur}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
        }),
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new error_middleware_1.AppError(502, `Service Gemini indisponible (${res.status}). ${errText.slice(0, 200)}`);
    }
    const json = (await res.json());
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text?.trim()) {
        throw new error_middleware_1.AppError(502, 'Réponse IA vide.');
    }
    return { text: text.trim() };
}
/** Suggestions de titres de projet à partir du profil (optionnel, même clé API). */
async function suggestProjectTitleFromCv(params) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        throw new error_middleware_1.AppError(503, 'Assistant IA non configuré (GEMINI_API_KEY manquante).');
    }
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    const prompt = `Tu es un responsable pédagogique au CNI (Tunisie).
Propose 3 intitulés de projet de stage PFE/PFA courts (max 90 caractères chacun) adaptés au profil.
Réponds en français, liste numérotée 1. 2. 3. sans autre texte.

Profil stagiaire : ${params.prenom} ${params.nom}
Spécialité : ${params.specialite || 'non précisée'}
École : ${params.ecole || 'non précisée'}
Motivation / centres d'intérêt : ${params.motivation || 'non précisé'}
Sujet déjà proposé par le candidat : ${params.sujetActuel || 'aucun'}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 512 },
        }),
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new error_middleware_1.AppError(502, `Service Gemini indisponible (${res.status}). ${errText.slice(0, 200)}`);
    }
    const json = (await res.json());
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text?.trim()) {
        throw new error_middleware_1.AppError(502, 'Réponse IA vide.');
    }
    return { text: text.trim() };
}
//# sourceMappingURL=gemini.service.js.map