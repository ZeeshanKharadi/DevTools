"use client";

type PdfJsModule = typeof import("pdfjs-dist");
type PDFDocumentProxy = import("pdfjs-dist").PDFDocumentProxy;

let pdfjsModule: PdfJsModule | null = null;
let workerConfigured = false;

async function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsModule) {
    pdfjsModule = await import("pdfjs-dist");
  }
  if (!workerConfigured && typeof window !== "undefined") {
    pdfjsModule.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    workerConfigured = true;
  }
  return pdfjsModule;
}

export async function openPdfJsDocument(
  data: ArrayBuffer,
): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({
    data: data.slice(0),
    useSystemFonts: true,
  });
  return loadingTask.promise;
}

export async function closePdfJsDocument(doc: PDFDocumentProxy): Promise<void> {
  await doc.cleanup();
}

export async function renderPdfPageToCanvas(
  doc: PDFDocumentProxy,
  pageNumber: number,
  scale: number,
): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create a canvas for PDF rendering.");
  }
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({
    canvasContext: context,
    viewport,
    canvas,
  }).promise;
  return canvas;
}

export async function renderPdfPageToJpeg(
  doc: PDFDocumentProxy,
  pageNumber: number,
  scale: number,
  quality: number,
): Promise<Blob> {
  const canvas = await renderPdfPageToCanvas(doc, pageNumber, scale);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error(`Could not convert page ${pageNumber} to JPG.`));
          return;
        }
        resolve(result);
      },
      "image/jpeg",
      quality,
    );
  });
  canvas.width = 0;
  canvas.height = 0;
  return blob;
}
