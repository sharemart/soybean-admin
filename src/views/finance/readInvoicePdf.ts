import { parseInvoicePieces } from '@/views/finance/invoicePdf';
import type { ParsedInvoice, PdfTextPiece } from '@/views/finance/invoicePdf';

let workerReady: Promise<typeof import('pdfjs-dist')> | null = null;

/**
 * 打包后的 worker 是 .mjs。部分静态服务器把它当成 application/octet-stream，
 * 浏览器会拒绝作为模块加载。先取回脚本内容，再用 JavaScript 类型的 Blob 启动。
 */
async function createWorkerSrc() {
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  const response = await fetch(worker.default);
  if (!response.ok) throw new Error('pdf worker load failed');
  const code = await response.text();
  return URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
}

function loadPdfjs() {
  if (!workerReady) {
    workerReady = (async () => {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = await createWorkerSrc();
      return pdfjs;
    })().catch(error => {
      workerReady = null;
      throw error;
    });
  }
  return workerReady;
}

/** 从 PDF 电子发票的文字层读取抬头、税号、发票号、金额和开票日期 */
export async function readInvoicePdf(file: File): Promise<ParsedInvoice | null> {
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data, verbosity: 0 }).promise;
  try {
    const pieces: PdfTextPiece[] = [];
    const pageCount = Math.min(doc.numPages, 2);
    for (let pageNo = 1; pageNo <= pageCount; pageNo += 1) {
      // eslint-disable-next-line no-await-in-loop
      const page = await doc.getPage(pageNo);
      // eslint-disable-next-line no-await-in-loop
      const content = await page.getTextContent();
      content.items.forEach(item => {
        if (!('str' in item) || !item.str.trim()) return;
        const [, , , , x, y] = item.transform;
        pieces.push({ text: item.str, x, y, width: item.width });
      });
    }
    return parseInvoicePieces(pieces);
  } finally {
    await doc.destroy();
  }
}
