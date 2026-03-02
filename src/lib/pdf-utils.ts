import * as pdfjsLib from 'pdfjs-dist';

// Use CDN worker matching installed version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface PdfPage {
  pageNumber: number;
  imageBase64: string;
  thumbnailUrl: string;
}

const RENDER_SCALE = 2; // ~150 DPI for A4
const THUMBNAIL_MAX_WIDTH = 200;

/**
 * Extract all pages from a PDF file as base64 PNG images
 */
export async function extractPdfPages(
  file: File,
  onProgress?: (current: number, total: number) => void,
): Promise<PdfPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const pages: PdfPage[] = [];

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.(i, totalPages);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: RENDER_SCALE });

    // Render full resolution
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const imageBase64 = canvas.toDataURL('image/png');

    // Render thumbnail
    const thumbScale = THUMBNAIL_MAX_WIDTH / viewport.width * RENDER_SCALE;
    const thumbViewport = page.getViewport({ scale: thumbScale });
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = thumbViewport.width;
    thumbCanvas.height = thumbViewport.height;
    const thumbCtx = thumbCanvas.getContext('2d')!;
    await page.render({ canvasContext: thumbCtx, viewport: thumbViewport }).promise;
    const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.7);

    pages.push({ pageNumber: i, imageBase64, thumbnailUrl });

    // Cleanup
    canvas.width = 0;
    canvas.height = 0;
    thumbCanvas.width = 0;
    thumbCanvas.height = 0;
  }

  return pages;
}

/**
 * Convert an image file to base64
 */
export function imageFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
