export declare function normalizeOcrText(raw: string): string;
/** OCR sur image PNG / JPEG / WebP (buffer), plusieurs PSM pour maximiser le texte lu. */
export declare function ocrRasterImage(buf: Buffer): Promise<string>;
/**
 * Poppler `pdftoppm` → PNG puis Tesseract (souvent plus fiable que pdf.js+canvas sur certains PDF Windows).
 */
export declare function extractPdfTextViaPdftoppmOcr(buf: Buffer): Promise<string>;
/**
 * Rendu PDF → PNG (pdf.js + @napi-rs/canvas) puis OCR Tesseract, page par page.
 * Permet de lire des CV scannés sans envoyer le PDF à Gemini.
 */
export declare function extractPdfTextViaCanvasOcr(buf: Buffer): Promise<string>;
//# sourceMappingURL=cvOcr.service.d.ts.map