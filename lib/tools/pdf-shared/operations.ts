import {
  PDFDocument,
  degrees,
  rgb,
} from "pdf-lib";
import { MAX_PDF_BYTES, isPdfMime } from "./utils";

export type LoadedPdf = {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  bytes: ArrayBuffer;
};

export class PdfToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfToolError";
  }
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `pdf-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function readPdfFile(file: File): Promise<LoadedPdf> {
  if (!isPdfMime(file)) {
    throw new PdfToolError(`"${file.name}" is not a PDF file.`);
  }
  if (file.size === 0) {
    throw new PdfToolError(`"${file.name}" is empty.`);
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new PdfToolError(
      `"${file.name}" is larger than 50 MB. Try a smaller file.`,
    );
  }

  const bytes = await file.arrayBuffer();
  try {
    const doc = await PDFDocument.load(bytes, {
      ignoreEncryption: false,
      updateMetadata: false,
    });
    if (doc.isEncrypted) {
      throw new PdfToolError(
        `"${file.name}" is password-protected. Unlock it before using this tool.`,
      );
    }
    const pageCount = doc.getPageCount();
    if (pageCount < 1) {
      throw new PdfToolError(`"${file.name}" has no pages.`);
    }
    return {
      id: createId(),
      file,
      name: file.name,
      size: file.size,
      pageCount,
      bytes,
    };
  } catch (error) {
    if (error instanceof PdfToolError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "";
    if (/encrypt|password/i.test(message)) {
      throw new PdfToolError(
        `"${file.name}" is password-protected. Unlock it before using this tool.`,
      );
    }
    throw new PdfToolError(
      `"${file.name}" could not be read. It may be corrupted or unsupported.`,
    );
  }
}

export async function mergePdfs(files: LoadedPdf[]): Promise<Uint8Array> {
  if (files.length < 2) {
    throw new PdfToolError("Add at least two PDFs to merge.");
  }
  const output = await PDFDocument.create();
  for (const file of files) {
    const source = await PDFDocument.load(file.bytes, {
      ignoreEncryption: false,
      updateMetadata: false,
    });
    const pages = await output.copyPages(source, source.getPageIndices());
    for (const page of pages) {
      output.addPage(page);
    }
  }
  return output.save();
}

export async function extractPages(
  bytes: ArrayBuffer,
  oneBasedPages: number[],
): Promise<Uint8Array> {
  if (oneBasedPages.length === 0) {
    throw new PdfToolError("Select at least one page.");
  }
  const source = await PDFDocument.load(bytes, {
    ignoreEncryption: false,
    updateMetadata: false,
  });
  const count = source.getPageCount();
  for (const page of oneBasedPages) {
    if (page < 1 || page > count) {
      throw new PdfToolError(`Page ${page} is out of range.`);
    }
  }
  const output = await PDFDocument.create();
  const indices = oneBasedPages.map((page) => page - 1);
  const copied = await output.copyPages(source, indices);
  for (const page of copied) {
    output.addPage(page);
  }
  return output.save();
}

export async function splitPagesToBuffers(
  bytes: ArrayBuffer,
  oneBasedPages: number[],
): Promise<{ name: string; data: Uint8Array }[]> {
  const results: { name: string; data: Uint8Array }[] = [];
  for (const page of oneBasedPages) {
    const data = await extractPages(bytes, [page]);
    results.push({
      name: `infyratools-page-${page}.pdf`,
      data,
    });
  }
  return results;
}

export async function rotatePdfPages(
  bytes: ArrayBuffer,
  rotations: Record<number, number>,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, {
    ignoreEncryption: false,
    updateMetadata: false,
  });
  const pages = doc.getPages();
  for (const [pageKey, delta] of Object.entries(rotations)) {
    const index = Number(pageKey) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= pages.length) {
      continue;
    }
    const amount = ((delta % 360) + 360) % 360;
    if (amount === 0) {
      continue;
    }
    const page = pages[index];
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + amount) % 360));
  }
  return doc.save();
}

export type PageSizeOption = "a4" | "letter" | "fit";
export type OrientationOption = "portrait" | "landscape";
export type MarginOption = "none" | "small" | "medium";

const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
} as const;

const MARGINS = {
  none: 0,
  small: 24,
  medium: 48,
} as const;

export async function imagesToPdf(
  images: { bytes: ArrayBuffer; mime: string; name: string }[],
  options: {
    pageSize: PageSizeOption;
    orientation: OrientationOption;
    margin: MarginOption;
  },
): Promise<Uint8Array> {
  if (images.length === 0) {
    throw new PdfToolError("Add at least one image.");
  }

  const doc = await PDFDocument.create();
  const margin = MARGINS[options.margin];

  for (const image of images) {
    const embedded =
      image.mime.includes("png") || image.name.toLowerCase().endsWith(".png")
        ? await doc.embedPng(image.bytes)
        : await doc.embedJpg(image.bytes);

    let pageWidth: number;
    let pageHeight: number;
    if (options.pageSize === "fit") {
      pageWidth = embedded.width + margin * 2;
      pageHeight = embedded.height + margin * 2;
    } else {
      const base = PAGE_SIZES[options.pageSize];
      if (options.orientation === "landscape") {
        pageWidth = base.height;
        pageHeight = base.width;
      } else {
        pageWidth = base.width;
        pageHeight = base.height;
      }
    }

    const page = doc.addPage([pageWidth, pageHeight]);
    const maxWidth = Math.max(pageWidth - margin * 2, 1);
    const maxHeight = Math.max(pageHeight - margin * 2, 1);
    const scale = Math.min(maxWidth / embedded.width, maxHeight / embedded.height);
    const drawWidth = embedded.width * scale;
    const drawHeight = embedded.height * scale;
    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: rgb(1, 1, 1),
    });
    page.drawImage(embedded, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return doc.save();
}
