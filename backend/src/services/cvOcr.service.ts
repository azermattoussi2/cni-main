import { spawnSync } from 'child_process';
import { createRequire } from 'module';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';
import { createWorker, PSM } from 'tesseract.js';
import { logger } from '../config/logger';

const dynamicImportEsm = new Function('modulePath', 'return import(modulePath)') as (
  modulePath: string
) => Promise<any>;

const MAX_OCR_PAGES = 8;

/** Modes de segmentation Tesseract : on garde le résultat le plus long. */
const TESSERACT_PSM_MODES = [PSM.AUTO, PSM.SINGLE_BLOCK, PSM.SPARSE_TEXT] as const;

function resolveTesseractBin(): string {
  const envPath = (process.env.TESSERACT_PATH || '').trim();
  if (envPath && fs.existsSync(envPath)) return envPath;
  const winDefault = 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe';
  if (process.platform === 'win32' && fs.existsSync(winDefault)) return winDefault;
  return 'tesseract';
}

function resolvePdftoppmBin(): string {
  const envPath = (process.env.PDFTOPPM_PATH || '').trim();
  if (envPath && fs.existsSync(envPath)) return envPath;
  const popplerBin = (process.env.POPPLER_BIN || '').trim();
  if (popplerBin) {
    const candidate = path.join(popplerBin, process.platform === 'win32' ? 'pdftoppm.exe' : 'pdftoppm');
    if (fs.existsSync(candidate)) return candidate;
  }
  return 'pdftoppm';
}

function runTesseractCli(imagePath: string): string {
  const bin = resolveTesseractBin();
  let best = '';
  for (const psm of TESSERACT_PSM_MODES) {
    const r = spawnSync(
      bin,
      [imagePath, 'stdout', '-l', 'fra+eng', '--psm', String(psm)],
      { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, windowsHide: true }
    );
    if (r.error) {
      logger.info(`tesseract CLI indisponible (${bin}): ${r.error.message}`);
      return '';
    }
    if (r.status !== 0) continue;
    const txt = normalizeOcrText(String(r.stdout || ''));
    if (txt.length > best.length) best = txt;
  }
  return best;
}

function resolvePdfJsPackageDir(): string | null {
  try {
    const req = createRequire(__filename);
    return path.dirname(req.resolve('pdfjs-dist/package.json'));
  } catch {
    return null;
  }
}

type CanvasModule = typeof import('@napi-rs/canvas');

type CanvasCtx = { canvas: { width: number; height: number; toBuffer: (mime: 'image/png') => Buffer }; context: unknown };

class NodeCanvasFactory {
  constructor(private readonly createCanvas: CanvasModule['createCanvas']) {}

  create(width: number, height: number): CanvasCtx {
    const canvas = this.createCanvas(Math.ceil(width), Math.ceil(height));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D introuvable');
    return { canvas: canvas as CanvasCtx['canvas'], context };
  }

  reset(canvasAndContext: CanvasCtx, width: number, height: number) {
    canvasAndContext.canvas.width = Math.ceil(width);
    canvasAndContext.canvas.height = Math.ceil(height);
  }

  destroy(canvasAndContext: CanvasCtx) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
  }
}

export function normalizeOcrText(raw: string): string {
  return raw
    .replace(/\u0000/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** OCR sur image PNG / JPEG / WebP (buffer), plusieurs PSM pour maximiser le texte lu. */
export async function ocrRasterImage(buf: Buffer): Promise<string> {
  if (!buf.length) return '';
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cni-ocr-img-'));
  const imgPath = path.join(tmpDir, 'input.png');
  fs.writeFileSync(imgPath, buf);
  const cliText = runTesseractCli(imgPath);
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
  if (cliText) return cliText;

  // Fallback wasm si le binaire local n'est pas installé.
  let best = '';
  const worker = await createWorker('fra+eng');
  try {
    for (const psm of TESSERACT_PSM_MODES) {
      try {
        await worker.setParameters({ tessedit_pageseg_mode: psm });
        const { data } = await worker.recognize(buf);
        const t = normalizeOcrText(data.text || '');
        if (t.length > best.length) best = t;
      } catch (e) {
        logger.warn(`OCR image (psm=${psm}): ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } finally {
    await worker.terminate().catch(() => {});
  }
  return best;
}

function collectPdftoppmPngs(tmpDir: string, baseName: string): string[] {
  if (!fs.existsSync(tmpDir)) return [];
  const prefix = `${baseName}-`;
  const files = fs
    .readdirSync(tmpDir)
    .filter((f) => f.toLowerCase().startsWith(prefix.toLowerCase()) && f.toLowerCase().endsWith('.png'));
  const withNum = files.map((f) => {
    const m = f.slice(prefix.length).match(/^(\d+)/);
    const num = m ? parseInt(m[1], 10) : 0;
    return { f, num };
  });
  withNum.sort((a, b) => a.num - b.num);
  return withNum.map(({ f }) => path.join(tmpDir, f));
}

/**
 * Poppler `pdftoppm` → PNG puis Tesseract (souvent plus fiable que pdf.js+canvas sur certains PDF Windows).
 */
export async function extractPdfTextViaPdftoppmOcr(buf: Buffer): Promise<string> {
  if (!buf.length) return '';
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cni-pdftoppm-'));
  const pdfPath = path.join(tmpDir, 'cv.pdf');
  const prefix = path.join(tmpDir, 'page');
  const baseName = 'page';
  try {
    fs.writeFileSync(pdfPath, buf);
    const pdftoppmBin = resolvePdftoppmBin();
    const r = spawnSync(
      pdftoppmBin,
      ['-png', '-r', '240', '-f', '1', '-l', String(MAX_OCR_PAGES), pdfPath, prefix],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true }
    );
    if (r.error) {
      logger.info(`pdftoppm: binaire absent ou erreur (${r.error.message})`);
      return '';
    }
    if (r.status !== 0) {
      logger.info(`pdftoppm: code ${r.status} stderr=${String(r.stderr || '').slice(0, 200)}`);
      return '';
    }
    const pngPaths = collectPdftoppmPngs(tmpDir, baseName).slice(0, MAX_OCR_PAGES);
    const parts: string[] = [];
    for (const pngPath of pngPaths) {
      const text = await ocrRasterImage(fs.readFileSync(pngPath));
      if (text) parts.push(text);
    }
    const joined = normalizeOcrText(parts.join('\n\n'));
    if (joined.length) logger.info(`CV OCR pdftoppm: ${parts.length} page(s), ${joined.length} caractères`);
    return joined;
  } catch (e) {
    logger.warn(`OCR pdftoppm: ${e instanceof Error ? e.message : String(e)}`);
    return '';
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

/**
 * Rendu PDF → PNG (pdf.js + @napi-rs/canvas) puis OCR Tesseract, page par page.
 * Permet de lire des CV scannés sans envoyer le PDF à Gemini.
 */
export async function extractPdfTextViaCanvasOcr(buf: Buffer): Promise<string> {
  if (!buf.length) return '';
  let canvasModule: CanvasModule;
  try {
    canvasModule = await import('@napi-rs/canvas');
  } catch (e) {
    logger.warn(`@napi-rs/canvas indisponible: ${e instanceof Error ? e.message : String(e)}`);
    return '';
  }

  try {
    const pdfjs: any = await dynamicImportEsm('pdfjs-dist/legacy/build/pdf.mjs');
    const pkgDir = resolvePdfJsPackageDir();
    const workerFile = pkgDir
      ? path.join(pkgDir, 'legacy/build/pdf.worker.mjs')
      : path.join(__dirname, '../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
    if (!fs.existsSync(workerFile)) {
      logger.warn(`OCR PDF: worker pdf.js introuvable (${workerFile})`);
      return '';
    }
    pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerFile).href;
    const docParams: any = {
      data: new Uint8Array(buf),
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false,
      verbosity: 0,
    };
    if (pkgDir) {
      docParams.cMapUrl = pathToFileURL(path.join(pkgDir, 'cmaps/')).href;
      docParams.cMapPacked = true;
    }
    const doc = await pdfjs.getDocument(docParams).promise;
    const canvasFactory = new NodeCanvasFactory(canvasModule.createCanvas);
    const tessWorker = await createWorker('fra+eng');
    const scales = [2.25, 3.0];
    let bestJoined = '';
    try {
      const n = Math.min(doc.numPages, MAX_OCR_PAGES);
      for (const scale of scales) {
        const parts: string[] = [];
        for (let i = 1; i <= n; i += 1) {
          const page = await doc.getPage(i);
          const viewport = page.getViewport({ scale });
          const c = canvasFactory.create(viewport.width, viewport.height);
          const renderTask = (page as unknown as { render: (p: Record<string, unknown>) => { promise: Promise<void> } }).render({
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
              if (t.length > bestPage.length) bestPage = t;
            } catch {
              /* ignore */
            }
          }
          if (bestPage) parts.push(bestPage);
          try {
            (page as unknown as { cleanup?: () => boolean }).cleanup?.();
          } catch {
            /* ignore */
          }
        }
        const joined = normalizeOcrText(parts.join('\n\n'));
        if (joined.length > bestJoined.length) bestJoined = joined;
      }
    } finally {
      await tessWorker.terminate().catch(() => {});
    }
    logger.info(`CV OCR PDF (canvas): ${Math.min(doc.numPages, MAX_OCR_PAGES)} page(s), ${bestJoined.length} caractères`);
    return bestJoined;
  } catch (e) {
    logger.warn(`OCR PDF (canvas): ${e instanceof Error ? e.message : String(e)}`);
    return '';
  }
}
