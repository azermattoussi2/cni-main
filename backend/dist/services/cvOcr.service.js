"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeOcrText = normalizeOcrText;
exports.ocrRasterImage = ocrRasterImage;
exports.extractPdfTextViaPdftoppmOcr = extractPdfTextViaPdftoppmOcr;
exports.extractPdfTextViaCanvasOcr = extractPdfTextViaCanvasOcr;
const child_process_1 = require("child_process");
const module_1 = require("module");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const tesseract_js_1 = require("tesseract.js");
const logger_1 = require("../config/logger");
const dynamicImportEsm = new Function('modulePath', 'return import(modulePath)');
const MAX_OCR_PAGES = 8;
/** Modes de segmentation Tesseract : on garde le résultat le plus long. */
const TESSERACT_PSM_MODES = [tesseract_js_1.PSM.AUTO, tesseract_js_1.PSM.SINGLE_BLOCK, tesseract_js_1.PSM.SPARSE_TEXT];
function resolveTesseractBin() {
    const envPath = (process.env.TESSERACT_PATH || '').trim();
    if (envPath && fs_1.default.existsSync(envPath))
        return envPath;
    const winDefault = 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe';
    if (process.platform === 'win32' && fs_1.default.existsSync(winDefault))
        return winDefault;
    return 'tesseract';
}
function resolvePdftoppmBin() {
    const envPath = (process.env.PDFTOPPM_PATH || '').trim();
    if (envPath && fs_1.default.existsSync(envPath))
        return envPath;
    const popplerBin = (process.env.POPPLER_BIN || '').trim();
    if (popplerBin) {
        const candidate = path_1.default.join(popplerBin, process.platform === 'win32' ? 'pdftoppm.exe' : 'pdftoppm');
        if (fs_1.default.existsSync(candidate))
            return candidate;
    }
    return 'pdftoppm';
}
function runTesseractCli(imagePath) {
    const bin = resolveTesseractBin();
    let best = '';
    for (const psm of TESSERACT_PSM_MODES) {
        const r = (0, child_process_1.spawnSync)(bin, [imagePath, 'stdout', '-l', 'fra+eng', '--psm', String(psm)], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, windowsHide: true });
        if (r.error) {
            logger_1.logger.info(`tesseract CLI indisponible (${bin}): ${r.error.message}`);
            return '';
        }
        if (r.status !== 0)
            continue;
        const txt = normalizeOcrText(String(r.stdout || ''));
        if (txt.length > best.length)
            best = txt;
    }
    return best;
}
function resolvePdfJsPackageDir() {
    try {
        const req = (0, module_1.createRequire)(__filename);
        return path_1.default.dirname(req.resolve('pdfjs-dist/package.json'));
    }
    catch {
        return null;
    }
}
class NodeCanvasFactory {
    constructor(createCanvas) {
        this.createCanvas = createCanvas;
    }
    create(width, height) {
        const canvas = this.createCanvas(Math.ceil(width), Math.ceil(height));
        const context = canvas.getContext('2d');
        if (!context)
            throw new Error('Canvas 2D introuvable');
        return { canvas: canvas, context };
    }
    reset(canvasAndContext, width, height) {
        canvasAndContext.canvas.width = Math.ceil(width);
        canvasAndContext.canvas.height = Math.ceil(height);
    }
    destroy(canvasAndContext) {
        canvasAndContext.canvas.width = 0;
        canvasAndContext.canvas.height = 0;
    }
}
function normalizeOcrText(raw) {
    return raw
        .replace(/\u0000/g, ' ')
        .replace(/\r/g, '\n')
        .replace(/[ \t\f\v]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
/** OCR sur image PNG / JPEG / WebP (buffer), plusieurs PSM pour maximiser le texte lu. */
async function ocrRasterImage(buf) {
    if (!buf.length)
        return '';
    const tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'cni-ocr-img-'));
    const imgPath = path_1.default.join(tmpDir, 'input.png');
    fs_1.default.writeFileSync(imgPath, buf);
    const cliText = runTesseractCli(imgPath);
    try {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    }
    catch {
        /* ignore */
    }
    if (cliText)
        return cliText;
    // Fallback wasm si le binaire local n'est pas installé.
    let best = '';
    const worker = await (0, tesseract_js_1.createWorker)('fra+eng');
    try {
        for (const psm of TESSERACT_PSM_MODES) {
            try {
                await worker.setParameters({ tessedit_pageseg_mode: psm });
                const { data } = await worker.recognize(buf);
                const t = normalizeOcrText(data.text || '');
                if (t.length > best.length)
                    best = t;
            }
            catch (e) {
                logger_1.logger.warn(`OCR image (psm=${psm}): ${e instanceof Error ? e.message : String(e)}`);
            }
        }
    }
    finally {
        await worker.terminate().catch(() => { });
    }
    return best;
}
function collectPdftoppmPngs(tmpDir, baseName) {
    if (!fs_1.default.existsSync(tmpDir))
        return [];
    const prefix = `${baseName}-`;
    const files = fs_1.default
        .readdirSync(tmpDir)
        .filter((f) => f.toLowerCase().startsWith(prefix.toLowerCase()) && f.toLowerCase().endsWith('.png'));
    const withNum = files.map((f) => {
        const m = f.slice(prefix.length).match(/^(\d+)/);
        const num = m ? parseInt(m[1], 10) : 0;
        return { f, num };
    });
    withNum.sort((a, b) => a.num - b.num);
    return withNum.map(({ f }) => path_1.default.join(tmpDir, f));
}
/**
 * Poppler `pdftoppm` → PNG puis Tesseract (souvent plus fiable que pdf.js+canvas sur certains PDF Windows).
 */
async function extractPdfTextViaPdftoppmOcr(buf) {
    if (!buf.length)
        return '';
    const tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'cni-pdftoppm-'));
    const pdfPath = path_1.default.join(tmpDir, 'cv.pdf');
    const prefix = path_1.default.join(tmpDir, 'page');
    const baseName = 'page';
    try {
        fs_1.default.writeFileSync(pdfPath, buf);
        const pdftoppmBin = resolvePdftoppmBin();
        const r = (0, child_process_1.spawnSync)(pdftoppmBin, ['-png', '-r', '240', '-f', '1', '-l', String(MAX_OCR_PAGES), pdfPath, prefix], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true });
        if (r.error) {
            logger_1.logger.info(`pdftoppm: binaire absent ou erreur (${r.error.message})`);
            return '';
        }
        if (r.status !== 0) {
            logger_1.logger.info(`pdftoppm: code ${r.status} stderr=${String(r.stderr || '').slice(0, 200)}`);
            return '';
        }
        const pngPaths = collectPdftoppmPngs(tmpDir, baseName).slice(0, MAX_OCR_PAGES);
        const parts = [];
        for (const pngPath of pngPaths) {
            const text = await ocrRasterImage(fs_1.default.readFileSync(pngPath));
            if (text)
                parts.push(text);
        }
        const joined = normalizeOcrText(parts.join('\n\n'));
        if (joined.length)
            logger_1.logger.info(`CV OCR pdftoppm: ${parts.length} page(s), ${joined.length} caractères`);
        return joined;
    }
    catch (e) {
        logger_1.logger.warn(`OCR pdftoppm: ${e instanceof Error ? e.message : String(e)}`);
        return '';
    }
    finally {
        try {
            fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
        }
        catch {
            /* ignore */
        }
    }
}
/**
 * Rendu PDF → PNG (pdf.js + @napi-rs/canvas) puis OCR Tesseract, page par page.
 * Permet de lire des CV scannés sans envoyer le PDF à Gemini.
 */
async function extractPdfTextViaCanvasOcr(buf) {
    if (!buf.length)
        return '';
    let canvasModule;
    try {
        canvasModule = await Promise.resolve().then(() => __importStar(require('@napi-rs/canvas')));
    }
    catch (e) {
        logger_1.logger.warn(`@napi-rs/canvas indisponible: ${e instanceof Error ? e.message : String(e)}`);
        return '';
    }
    try {
        const pdfjs = await dynamicImportEsm('pdfjs-dist/legacy/build/pdf.mjs');
        const pkgDir = resolvePdfJsPackageDir();
        const workerFile = pkgDir
            ? path_1.default.join(pkgDir, 'legacy/build/pdf.worker.mjs')
            : path_1.default.join(__dirname, '../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
        if (!fs_1.default.existsSync(workerFile)) {
            logger_1.logger.warn(`OCR PDF: worker pdf.js introuvable (${workerFile})`);
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
        const doc = await pdfjs.getDocument(docParams).promise;
        const canvasFactory = new NodeCanvasFactory(canvasModule.createCanvas);
        const tessWorker = await (0, tesseract_js_1.createWorker)('fra+eng');
        const scales = [2.25, 3.0];
        let bestJoined = '';
        try {
            const n = Math.min(doc.numPages, MAX_OCR_PAGES);
            for (const scale of scales) {
                const parts = [];
                for (let i = 1; i <= n; i += 1) {
                    const page = await doc.getPage(i);
                    const viewport = page.getViewport({ scale });
                    const c = canvasFactory.create(viewport.width, viewport.height);
                    const renderTask = page.render({
                        canvasContext: c.context,
                        viewport,
                        canvasFactory,
                    });
                    await renderTask.promise;
                    const pngBuf = c.canvas.toBuffer('image/png');
                    canvasFactory.destroy(c);
                    let bestPage = '';
                    for (const psm of TESSERACT_PSM_MODES) {
                        try {
                            await tessWorker.setParameters({ tessedit_pageseg_mode: psm });
                            const { data } = await tessWorker.recognize(pngBuf);
                            const t = normalizeOcrText(data.text || '');
                            if (t.length > bestPage.length)
                                bestPage = t;
                        }
                        catch {
                            /* ignore */
                        }
                    }
                    if (bestPage)
                        parts.push(bestPage);
                    try {
                        page.cleanup?.();
                    }
                    catch {
                        /* ignore */
                    }
                }
                const joined = normalizeOcrText(parts.join('\n\n'));
                if (joined.length > bestJoined.length)
                    bestJoined = joined;
            }
        }
        finally {
            await tessWorker.terminate().catch(() => { });
        }
        logger_1.logger.info(`CV OCR PDF (canvas): ${Math.min(doc.numPages, MAX_OCR_PAGES)} page(s), ${bestJoined.length} caractères`);
        return bestJoined;
    }
    catch (e) {
        logger_1.logger.warn(`OCR PDF (canvas): ${e instanceof Error ? e.message : String(e)}`);
        return '';
    }
}
//# sourceMappingURL=cvOcr.service.js.map