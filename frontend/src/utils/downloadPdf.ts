import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Capture visuelle d’un bloc DOM (couleurs, graphiques Recharts, texte RTL, etc.)
 * puis export multipage A4 en PDF téléchargeable.
 */
export async function exportPageToPdf(target: HTMLElement | null, fileName: string): Promise<void> {
  if (!target) {
    throw new Error('Élément introuvable pour l’export PDF.');
  }

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  const w = Math.ceil(Math.max(target.scrollWidth, target.offsetWidth));
  const h = Math.ceil(Math.max(target.scrollHeight, target.offsetHeight));

  const canvas = await html2canvas(target, {
    width: w,
    height: h,
    x: 0,
    y: 0,
    scale: Math.min(2, Math.max(1.25, window.devicePixelRatio || 1)),
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    foreignObjectRendering: false,
    onclone: (_doc, el) => {
      const root = el as HTMLElement;
      root.style.height = `${h}px`;
      root.style.minHeight = `${h}px`;
      root.style.overflow = 'visible';
      root.querySelectorAll<HTMLElement>('.recharts-surface').forEach((node) => {
        node.style.overflow = 'visible';
      });
      root.querySelectorAll<HTMLElement>('.fc-scroller, .fc-scroller-harness, .fc-scroller-liquid-absolute').forEach((node) => {
        node.style.overflow = 'visible';
        node.style.maxHeight = 'none';
        node.style.height = 'auto';
      });
    },
  });

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const srcW = canvas.width;
  const srcH = canvas.height;

  const pxPerPage = (srcW * pageHeight) / pageWidth;

  let yPx = 0;
  let pageIndex = 0;
  while (yPx < srcH) {
    const sliceH = Math.min(pxPerPage, srcH - yPx);
    const slice = document.createElement('canvas');
    slice.width = srcW;
    slice.height = Math.ceil(sliceH);
    const ctx = slice.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D indisponible.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, yPx, srcW, sliceH, 0, 0, srcW, sliceH);
    const imgData = slice.toDataURL('image/jpeg', 0.92);
    const sliceMmH = (slice.height * pageWidth) / srcW;
    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, sliceMmH);
    yPx += sliceH;
    pageIndex += 1;
  }

  const name = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  pdf.save(name);
}
