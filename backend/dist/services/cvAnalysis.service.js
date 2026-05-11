"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvAnalysisService = exports.PdfTextEmptyError = void 0;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const module_1 = require("module");
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const storage_1 = require("../utils/storage");
const logger_1 = require("../config/logger");
const cvOcr_service_1 = require("./cvOcr.service");
const dynamicImportEsm = new Function('modulePath', 'return import(modulePath)');
function readGeminiKey() {
    const v = process.env.GEMINI_API_KEY;
    if (v == null || String(v).trim() === '')
        return undefined;
    return String(v).trim().replace(/^["']|["']$/g, '');
}
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
/** Modèles connus pour generateContent + PDF. */
const GEMINI_PDF_FALLBACK_MODELS = ['gemini-2.0-flash'];
function readGeminiModel() {
    const v = process.env.GEMINI_MODEL;
    const t = (v && String(v).trim()) || 'gemini-2.0-flash';
    return t.replace(/^["']|["']$/g, '');
}
function geminiPdfModelChain(configured) {
    return [configured, ...GEMINI_PDF_FALLBACK_MODELS].filter((m, i, a) => Boolean(m) && a.indexOf(m) === i);
}
function isGeminiQuotaOrRateLimit(message) {
    const m = message.toLowerCase();
    return (m.includes('quota') ||
        m.includes('resource_exhausted') ||
        m.includes('rate limit') ||
        m.includes('exceeded your') ||
        m.includes('free_tier') ||
        m.includes('limit: 0') ||
        m.includes(' 429') ||
        m.includes('http 429'));
}
function stripCodeFences(raw) {
    const t = raw.trim();
    const m = t.match(/^```(?:json)?\s*\r?\n?([\s\S]*?)\r?\n?```$/i);
    if (m)
        return m[1].trim();
    return t;
}
/** PDF présent mais extraction texte locale vide (scan, etc.) — traité dans analyzeCv via Gemini sur le fichier. */
class PdfTextEmptyError extends Error {
    constructor(resolvedPath) {
        super('Aucun texte extractible depuis ce PDF (lecture locale).');
        this.name = 'PdfTextEmptyError';
        this.resolvedPath = resolvedPath;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.PdfTextEmptyError = PdfTextEmptyError;
const COMMON_SKILLS = [
    'javascript', 'typescript', 'react', 'node', 'java', 'python', 'c#', 'php', 'sql',
    'docker', 'kubernetes', 'aws', 'azure', 'git', 'linux', 'html', 'css', 'angular',
    'vue', 'nestjs', 'express', 'spring', 'django', 'machine learning', 'devops',
];
/** En dessous : texte jugé « court » — analyse IA autorisée mais signalée (badge confiance limitée). */
const MIN_SUBSTANTIVE_TEXT = 80;
function escapeHtml(input) {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function normalizeText(raw) {
    return raw
        .replace(/\u0000/g, ' ')
        .replace(/\r/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
function firstLines(text, limit = 6) {
    return text.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, limit);
}
function detectName(text) {
    const lines = firstLines(text, 8);
    return lines.find((line) => /^[A-Za-zÀ-ÿ'\-\s]{6,60}$/.test(line) && line.split(' ').length <= 4);
}
function extractSkills(text) {
    const lower = text.toLowerCase();
    return COMMON_SKILLS.filter((skill) => lower.includes(skill));
}
function extractSectionLike(text, keywords) {
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
    const out = [];
    for (let i = 0; i < lines.length; i += 1) {
        const lineLower = lines[i].toLowerCase();
        if (keywords.some((k) => lineLower.includes(k))) {
            for (let j = i + 1; j < Math.min(i + 8, lines.length); j += 1) {
                if (lines[j].length < 2)
                    break;
                if (/^(competences|skills|education|formation|experience|projects|projets)/i.test(lines[j]))
                    break;
                out.push(lines[j]);
            }
        }
    }
    return [...new Set(out)].slice(0, 8);
}
function buildHtml(data) {
    const { name, skills, education, experience, projects } = data;
    const section = (title, rows) => {
        if (!rows.length)
            return '';
        return `
      <section style="margin-bottom:12px;">
        <h4 style="margin:0 0 6px;font-size:13px;font-weight:700;color:#0f172a;">${escapeHtml(title)}</h4>
        <ul style="margin:0;padding-left:18px;color:#334155;font-size:12px;line-height:1.5;">
          ${rows.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}
        </ul>
      </section>
    `;
    };
    return `
    <article style="font-family:Arial,sans-serif;">
      ${name ? `<p style="margin:0 0 10px;font-size:13px;"><strong>Nom détecté:</strong> ${escapeHtml(name)}</p>` : ''}
      ${section('Compétences', skills)}
      ${section('Formation', education)}
      ${section('Expérience', experience)}
      ${section('Projets', projects)}
    </article>
  `.trim();
}
/** Aucun texte + Gemini PDF refusé (quota) : pas de scores numériques (null en base). */
function buildAiUnavailableOutput(extractionMethods, failureReasons) {
    const extractedData = {
        name: undefined,
        skills: [],
        education: [],
        experience: [],
        projects: [],
        _analysisMeta: {
            quality: 'ai_unavailable',
            extractionMethods,
            textLength: 0,
            lowQuality: true,
            failureReasons,
        },
    };
    const ai = {
        score: null,
        moyenne: null,
        feedback: 'Statut : IA indisponible. No text found in PDF (aucun texte extrait), OCR failed (canvas + pdftoppm), puis Gemini quota exceeded or billing not enabled. ' +
            'Sur Windows : installez Poppler (https://github.com/oschwartz10612/poppler-windows/releases) et ajoutez le dossier au PATH pour activer pdftotext + pdftoppm (souvent indispensable pour les scans). ' +
            'Les scores ne sont pas affichés car ils ne seraient pas fondés. ' +
            'Actions : rétablir Gemini (Google AI Studio / facturation), attendre le quota, ou fournir un DOCX ou un PDF texte sélectionnable. ' +
            'Documentation : https://ai.google.dev/gemini-api/docs/rate-limits',
        strengths: [],
        weaknesses: [
            'Extraction locale vide malgré les passes automatiques (y compris OCR si installé).',
            'Lecture PDF par Gemini (vision) impossible (quota ou facturation).',
        ],
        recommendation: 'need_interview',
    };
    const note = '<p style="margin:0 0 12px;font-size:12px;color:#b45309;"><strong>IA indisponible</strong> — aucun texte exploitable et quota Gemini. Aucun score numérique attribué.</p>';
    return {
        extractedData,
        extractedHtml: note + buildHtml(extractedData),
        ai,
    };
}
function fallbackEvaluation(data, opts) {
    const skillsScore = Math.min(data.skills.length * 6, 30);
    const eduScore = Math.min(data.education.length * 8, 20);
    const expScore = Math.min(data.experience.length * 10, 30);
    const projScore = Math.min(data.projects.length * 10, 20);
    let score100 = Math.max(0, Math.min(100, skillsScore + eduScore + expScore + projScore));
    const emptyStruct = data.skills.length === 0 &&
        data.education.length === 0 &&
        data.experience.length === 0 &&
        data.projects.length === 0;
    if (emptyStruct && score100 === 0) {
        score100 = 50;
    }
    const moyenne20 = Number((score100 / 5).toFixed(1));
    const strengths = [];
    const weaknesses = [];
    if (emptyStruct && score100 === 50) {
        strengths.push('Informations limitées : évaluation prudente basée sur l’absence de signaux structurés locaux.');
        weaknesses.push('Peu de données exploitables après extraction — compléter le dossier ou fournir un autre format.');
    }
    if (data.skills.length >= 4)
        strengths.push('Bon niveau de compétences techniques détectées.');
    else if (!emptyStruct)
        weaknesses.push('Compétences techniques peu détaillées dans le CV.');
    if (data.projects.length >= 2)
        strengths.push('Présence de projets concrets.');
    else if (!emptyStruct)
        weaknesses.push('Projets insuffisamment décrits.');
    if (data.experience.length >= 2)
        strengths.push('Expériences pertinentes identifiées.');
    else if (!emptyStruct)
        weaknesses.push('Expériences professionnelles limitées ou peu détaillées.');
    const recommendation = score100 >= 75 ? 'accept' : score100 >= 50 ? 'need_interview' : 'reject';
    const tl = opts?.textLength;
    const prefix = opts?.note ||
        (tl != null && tl < MIN_SUBSTANTIVE_TEXT
            ? `Informations limitées (${tl} caractères extraits). `
            : '');
    return {
        score: score100,
        moyenne: moyenne20,
        feedback: `${prefix}Évaluation heuristique locale (sans note IA Gemini) — ${score100}/100, à interpréter avec prudence.`,
        strengths,
        weaknesses,
        recommendation,
    };
}
function parseGeminiJson(raw) {
    const cleaned = stripCodeFences(raw);
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start < 0 || end <= start)
        return null;
    try {
        const obj = JSON.parse(cleaned.slice(start, end + 1));
        const score = Number(obj.score);
        const moyenne = Number(obj.moyenne);
        const recommendation = String(obj.recommendation || '')
            .toLowerCase()
            .trim();
        if (!Number.isFinite(score) || !Number.isFinite(moyenne))
            return null;
        if (!['accept', 'reject', 'need_interview'].includes(recommendation))
            return null;
        return {
            score: Math.max(0, Math.min(100, score)),
            moyenne: Math.max(0, Math.min(20, moyenne)),
            feedback: String(obj.feedback || '').slice(0, 3000),
            strengths: Array.isArray(obj.strengths) ? obj.strengths.map(String).slice(0, 8) : [],
            weaknesses: Array.isArray(obj.weaknesses) ? obj.weaknesses.map(String).slice(0, 8) : [],
            recommendation: recommendation,
        };
    }
    catch {
        return null;
    }
}
function toStrList(v, max = 12) {
    if (!Array.isArray(v))
        return [];
    return v.map(String).map((s) => s.trim()).filter(Boolean).slice(0, max);
}
/** Réponse JSON Gemini lorsque le PDF est envoyé en pièce jointe (PDF scanné / texte non extractible). */
function parseGeminiPdfCvJson(raw) {
    const cleaned = stripCodeFences(raw);
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start < 0 || end <= start)
        return null;
    try {
        const obj = JSON.parse(cleaned.slice(start, end + 1));
        const ai = parseGeminiJson(cleaned);
        if (!ai)
            return null;
        const nameRaw = obj.name != null ? String(obj.name).trim() : '';
        const extracted = {
            name: nameRaw || undefined,
            skills: toStrList(obj.skills),
            education: toStrList(obj.education),
            experience: toStrList(obj.experience),
            projects: toStrList(obj.projects),
        };
        return { ai, extracted };
    }
    catch {
        return null;
    }
}
async function geminiFetchWith429Retry(url, init) {
    let res = null;
    const maxAttempts = 4;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        res = await fetch(url, init);
        if (res.status !== 429 || attempt === maxAttempts)
            return res;
        const backoffMs = 1200 * 2 ** (attempt - 1);
        logger_1.logger.warn(`Gemini: HTTP 429, retry ${attempt}/${maxAttempts} dans ${backoffMs} ms…`);
        await new Promise((r) => setTimeout(r, backoffMs));
    }
    return res;
}
async function evaluateWithGemini(cvText, opts) {
    const apiKey = readGeminiKey();
    if (!apiKey)
        return null;
    const model = readGeminiModel();
    const suffix = opts?.lowQuality
        ? `\n\nIMPORTANT : le texte du CV peut être incomplet, bruité ou issu d’OCR. Mentionnez explicitement « Informations limitées » dans le feedback si c’est le cas, donnez une évaluation prudente mais exploitable, et respectez STRICTEMENT le format JSON demandé.`
        : '';
    const prompt = `
Analyse ce CV et réponds STRICTEMENT en JSON:
{
  "score": number(0-100),
  "moyenne": number(0-20),
  "feedback": "texte",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendation": "accept|reject|need_interview"
}
CV:
${cvText.slice(0, 20000)}
${suffix}`.trim();
    const url = `${GEMINI_API_BASE}/models/${model}:generateContent`;
    const response = await geminiFetchWith429Retry(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2 },
        }),
    });
    const rawText = await response.text();
    if (!response.ok) {
        logger_1.logger.warn(`Gemini texte: HTTP ${response.status} — ${rawText.slice(0, 400)}`);
        return null;
    }
    let json;
    try {
        json = JSON.parse(rawText);
    }
    catch {
        logger_1.logger.warn('Gemini texte: réponse JSON invalide.');
        return null;
    }
    const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n') || '';
    return parseGeminiJson(text);
}
const PDF_GEMINI_MAX_BYTES = 12 * 1024 * 1024;
function resolvePdfJsPackageDir() {
    try {
        const req = (0, module_1.createRequire)(__filename);
        return path_1.default.dirname(req.resolve('pdfjs-dist/package.json'));
    }
    catch (e) {
        logger_1.logger.warn(`pdfjs-dist: résolution du paquet impossible (${e instanceof Error ? e.message : String(e)}).`);
        return null;
    }
}
/**
 * Si Poppler est installé (`pdftotext` dans le PATH), extraction souvent meilleure sur certains PDF.
 */
function extractPdfTextViaPdftotext(buf) {
    if (!buf.length)
        return '';
    const argSets = [['-', '-', '-layout'], ['-', '-']];
    for (const args of argSets) {
        try {
            const r = (0, child_process_1.spawnSync)('pdftotext', [...args], {
                input: buf,
                encoding: 'utf8',
                maxBuffer: 25 * 1024 * 1024,
                windowsHide: true,
            });
            if (r.error)
                continue;
            const rawOut = r.stdout;
            const out = rawOut == null ? '' : Buffer.isBuffer(rawOut) ? rawOut.toString('utf8') : String(rawOut);
            const normalized = normalizeText(out);
            if (normalized.length >= 12)
                return normalized;
        }
        catch {
            /* binaire absent ou erreur */
        }
    }
    return '';
}
/**
 * Deuxième passe d’extraction (PDF.js 4.x legacy) quand pdf-parse-new renvoie vide.
 * Souvent récupère du texte là où l’autre moteur échoue (polices, structure).
 */
async function extractPdfTextViaPdfJsLegacy(buf) {
    try {
        const pdfjs = await dynamicImportEsm('pdfjs-dist/legacy/build/pdf.mjs');
        const pkgDir = resolvePdfJsPackageDir();
        const workerFile = pkgDir
            ? path_1.default.join(pkgDir, 'legacy/build/pdf.worker.mjs')
            : path_1.default.join(__dirname, '../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
        if (!fs_1.default.existsSync(workerFile)) {
            logger_1.logger.warn(`pdfjs worker introuvable: ${workerFile}`);
            return '';
        }
        pdfjs.GlobalWorkerOptions.workerSrc = (0, url_1.pathToFileURL)(workerFile).href;
        const docParams = {
            data: new Uint8Array(buf),
            useSystemFonts: true,
            disableFontFace: true,
            isEvalSupported: false,
            verbosity: 0,
        };
        if (pkgDir) {
            docParams.cMapUrl = (0, url_1.pathToFileURL)(path_1.default.join(pkgDir, 'cmaps/')).href;
            docParams.cMapPacked = true;
        }
        const task = pdfjs.getDocument(docParams);
        const doc = await task.promise;
        const chunks = [];
        for (let i = 1; i <= doc.numPages; i += 1) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            for (const item of content.items) {
                if ('str' in item && item.str) {
                    chunks.push(item.str);
                    chunks.push(item.hasEOL ? '\n' : ' ');
                }
            }
            chunks.push('\n');
        }
        return normalizeText(chunks.join(''));
    }
    catch (e) {
        logger_1.logger.warn(`pdfjs-dist extraction: ${e instanceof Error ? e.message : String(e)}`);
        return '';
    }
}
/** Analyse le fichier PDF via Gemini (document joint), utile quand l’extraction texte locale renvoie vide. */
async function evaluateWithGeminiPdf(pdfBuffer) {
    const apiKey = readGeminiKey();
    if (!apiKey) {
        return {
            ok: false,
            message: 'GEMINI_API_KEY absente ou vide après nettoyage. Vérifiez backend/.env (sans espaces en trop), puis redémarrez le serveur.',
        };
    }
    const prompt = `
Tu es un recruteur RH. Le document joint est un CV au format PDF. Une extraction texte automatique a échoué (souvent PDF scanné).
Analyse le contenu du CV (texte visible, mise en page, listes) et réponds STRICTEMENT avec un seul objet JSON valide (pas de markdown), schéma:
{
  "score": <number 0-100>,
  "moyenne": <number 0-20>,
  "feedback": "<string>",
  "strengths": ["<string>", ...],
  "weaknesses": ["<string>", ...],
  "recommendation": "accept" | "reject" | "need_interview",
  "name": "<nom du candidat si visible, sinon chaîne vide>",
  "skills": ["<compétence>", ...],
  "education": ["<ligne>", ...],
  "experience": ["<ligne>", ...],
  "projects": ["<ligne>", ...]
}
Utilise des tableaux vides si une section est illisible.`.trim();
    const b64 = pdfBuffer.toString('base64');
    const partsOrders = [
        [{ text: prompt }, { inline_data: { mime_type: 'application/pdf', data: b64 } }],
        [{ inline_data: { mime_type: 'application/pdf', data: b64 } }, { text: prompt }],
    ];
    const modelsToTry = geminiPdfModelChain(readGeminiModel());
    let lastMessage = 'Réponse Gemini inattendue.';
    for (const model of modelsToTry) {
        const url = `${GEMINI_API_BASE}/models/${model}:generateContent`;
        for (const parts of partsOrders) {
            const response = await geminiFetchWith429Retry(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey,
                },
                body: JSON.stringify({
                    contents: [{ parts }],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 8192,
                    },
                }),
            });
            const rawText = await response.text();
            let body;
            try {
                body = JSON.parse(rawText);
            }
            catch {
                lastMessage = `HTTP ${response.status} — réponse non JSON (${rawText.slice(0, 200)}).`;
                logger_1.logger.warn(`Gemini PDF: parse JSON erreur modèle=${model} status=${response.status}`);
                continue;
            }
            if (!response.ok) {
                const errObj = body.error;
                const errMsg = errObj?.message || `HTTP ${response.status}`;
                const prefix = response.status === 429 ? 'HTTP 429 — ' : '';
                lastMessage = `Modèle « ${model} » : ${prefix}${errMsg}`;
                logger_1.logger.warn(`Gemini PDF API erreur: ${lastMessage}`);
                if (response.status === 400 && /API key|API_KEY|INVALID_ARGUMENT|expired/i.test(errMsg)) {
                    return { ok: false, message: lastMessage };
                }
                if (response.status === 403) {
                    return { ok: false, message: lastMessage };
                }
                if (response.status === 404) {
                    break;
                }
                continue;
            }
            const promptFb = body.promptFeedback;
            if (promptFb?.blockReason) {
                lastMessage = `Modèle « ${model} » : blocage (${promptFb.blockReason}).`;
                logger_1.logger.warn(`Gemini PDF: ${lastMessage}`);
                continue;
            }
            const candidates = body.candidates;
            const outText = candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n') || '';
            if (!outText) {
                lastMessage = `Modèle « ${model} » : pas de texte (finishReason=${candidates?.[0]?.finishReason || 'n/a'}).`;
                logger_1.logger.warn(`Gemini PDF: ${lastMessage} body=${rawText.slice(0, 400)}`);
                continue;
            }
            const parsed = parseGeminiPdfCvJson(outText);
            if (parsed) {
                return { ok: true, ai: parsed.ai, extracted: parsed.extracted };
            }
            lastMessage = `Modèle « ${model} » : JSON IA illisible. Début de réponse : ${outText.slice(0, 400)}`;
            logger_1.logger.warn(`Gemini PDF parse CV JSON échoué: ${outText.slice(0, 500)}`);
        }
    }
    return { ok: false, message: lastMessage };
}
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
async function extractCvPlainText(filePath) {
    const resolved = (0, storage_1.resolveStoredUploadPath)(filePath);
    if (!resolved) {
        throw new Error(`Fichier CV introuvable sur le serveur. Chemin enregistré : "${filePath}". ` +
            `Répertoire de travail : ${process.cwd()}. Vérifiez que le fichier existe sous backend/uploads.`);
    }
    const ext = path_1.default.extname(resolved).toLowerCase();
    const methods = [];
    const failureReasons = [];
    if (ext === '.pdf') {
        const buf = fs_1.default.readFileSync(resolved);
        const pdfParse = require('pdf-parse-new');
        const out = await pdfParse(buf);
        let text = normalizeText(out?.text || '');
        if (text)
            methods.push('pdf-parse');
        if (!text) {
            text = normalizeText(await extractPdfTextViaPdfJsLegacy(buf));
            if (text)
                methods.push('pdfjs-text');
            else
                failureReasons.push('No text found in PDF after PDF.js extraction.');
        }
        if (!text) {
            text = normalizeText(extractPdfTextViaPdftotext(buf));
            if (text)
                methods.push('pdftotext-poppler');
            else
                failureReasons.push('No text found in PDF after pdftotext (Poppler).');
        }
        if (!text) {
            text = normalizeText(await (0, cvOcr_service_1.extractPdfTextViaCanvasOcr)(buf));
            if (text)
                methods.push('ocr-tesseract-pdf-canvas');
            else
                failureReasons.push('OCR failed (canvas + Tesseract).');
        }
        if (!text) {
            text = normalizeText(await (0, cvOcr_service_1.extractPdfTextViaPdftoppmOcr)(buf));
            if (text)
                methods.push('ocr-tesseract-pdftoppm');
            else
                failureReasons.push('OCR failed (pdftoppm + Tesseract).');
        }
        logger_1.logger.info(`CV PDF: couches=${methods.length ? methods.join(' → ') : 'aucune'} longueur=${text.length}`);
        return { text, methods, resolvedPath: resolved, ext, failureReasons };
    }
    if (ext === '.docx') {
        const mammoth = require('mammoth');
        const out = await mammoth.extractRawText({ path: resolved });
        const text = normalizeText(out?.value || '');
        if (text)
            methods.push('mammoth-docx');
        logger_1.logger.info(`CV DOCX: longueur=${text.length}`);
        return { text, methods, resolvedPath: resolved, ext, failureReasons };
    }
    if (IMAGE_EXTENSIONS.has(ext)) {
        const buf = fs_1.default.readFileSync(resolved);
        const text = normalizeText(await (0, cvOcr_service_1.ocrRasterImage)(buf));
        if (text)
            methods.push('ocr-tesseract-image');
        logger_1.logger.info(`CV image ${ext}: longueur=${text.length}`);
        return { text, methods, resolvedPath: resolved, ext, failureReasons };
    }
    const raw = normalizeText(fs_1.default.readFileSync(resolved, 'utf-8'));
    if (raw)
        methods.push('utf8-text');
    logger_1.logger.info(`CV texte brut: longueur=${raw.length}`);
    return { text: raw, methods, resolvedPath: resolved, ext, failureReasons };
}
class CvAnalysisService {
    static async extractTextFromCv(filePath) {
        const r = await extractCvPlainText(filePath);
        return r.text;
    }
    static async analyzeCv(filePath) {
        const { text, methods, ext, failureReasons } = await extractCvPlainText(filePath);
        if (!text && ext === '.pdf') {
            logger_1.logger.warn('PDF sans texte après toutes les passes: arrêt pipeline (Unreadable scanned PDF).');
            return buildAiUnavailableOutput(methods, [
                ...failureReasons,
                'Unreadable scanned PDF.',
                'Upload DOCX or text-based PDF.',
            ]);
        }
        if (!text) {
            throw new Error(ext === '.docx'
                ? 'Aucun texte extrait du DOCX (fichier vide ou non pris en charge).'
                : IMAGE_EXTENSIONS.has(ext)
                    ? 'OCR sur image : aucun texte détecté (fichier illisible ou trop flou).'
                    : 'Fichier CV lu mais contenu texte vide.');
        }
        const lowQuality = text.length < MIN_SUBSTANTIVE_TEXT;
        const extractedBase = {
            name: detectName(text),
            skills: extractSkills(text),
            education: extractSectionLike(text, ['education', 'formation', 'universite', 'école']),
            experience: extractSectionLike(text, ['experience', 'expérience', 'stage', 'emploi']),
            projects: extractSectionLike(text, ['projet', 'projects', 'réalisation']),
        };
        const geminiAi = await evaluateWithGemini(text, { lowQuality });
        let ai;
        let quality;
        if (geminiAi) {
            ai = geminiAi;
            quality = lowQuality ? 'low_confidence' : 'full';
        }
        else {
            const note = readGeminiKey()
                ? "L'API Google Gemini n'a pas renvoyé d'évaluation exploitable (quota, erreur HTTP ou JSON illisible). "
                : undefined;
            ai = fallbackEvaluation(extractedBase, { textLength: text.length, note });
            quality = lowQuality ? 'low_confidence' : 'ai_fallback';
        }
        const extractedData = {
            ...extractedBase,
            _analysisMeta: {
                quality,
                extractionMethods: methods,
                textLength: text.length,
                lowQuality,
                failureReasons,
            },
        };
        const warnParts = [];
        if (lowQuality)
            warnParts.push(`Texte extrait court (${text.length} caractères) — interprétation à confiance limitée.`);
        if (!geminiAi && readGeminiKey())
            warnParts.push('Gemini indisponible ou réponse invalide : score heuristique local.');
        const warning = warnParts.length > 0
            ? `<p style="margin:0 0 10px;font-size:12px;color:#92400e;"><strong>Confiance limitée</strong> — ${warnParts.join(' ')}</p>`
            : '';
        return {
            extractedData,
            extractedHtml: warning + buildHtml(extractedData),
            ai,
        };
    }
}
exports.CvAnalysisService = CvAnalysisService;
//# sourceMappingURL=cvAnalysis.service.js.map