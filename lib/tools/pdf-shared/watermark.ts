import {
  PDFDocument,
  degrees,
  rgb,
  StandardFonts,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import { PdfToolError } from "./operations";
import { parsePageRanges } from "./utils";

export type WatermarkPosition =
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type WatermarkPageTarget =
  | { mode: "all" }
  | { mode: "first" }
  | { mode: "last" }
  | { mode: "range"; expression: string };

export type TextWatermarkOptions = {
  kind: "text";
  text: string;
  fontSize: number;
  color: RGB;
  opacity: number;
  rotation: number;
  position: WatermarkPosition;
  offsetX: number;
  offsetY: number;
};

export type ImageWatermarkOptions = {
  kind: "image";
  bytes: ArrayBuffer;
  mime: string;
  name: string;
  scale: number;
  opacity: number;
  rotation: number;
  position: WatermarkPosition;
  offsetX: number;
  offsetY: number;
};

export type WatermarkOptions = TextWatermarkOptions | ImageWatermarkOptions;

export function resolveWatermarkPages(
  pageCount: number,
  target: WatermarkPageTarget,
): number[] {
  if (pageCount < 1) {
    return [];
  }
  if (target.mode === "all") {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  if (target.mode === "first") {
    return [1];
  }
  if (target.mode === "last") {
    return [pageCount];
  }
  const parsed = parsePageRanges(target.expression, pageCount);
  if (parsed.error) {
    throw new PdfToolError(parsed.error);
  }
  return parsed.pages;
}

/**
 * Shared geometry for preview and pdf-lib export (PDF bottom-left origin).
 * `contentWidth` / `contentHeight` are the unrotated watermark box size.
 */
export function watermarkPlacement(
  pageWidth: number,
  pageHeight: number,
  contentWidth: number,
  contentHeight: number,
  position: WatermarkPosition,
  offsetX: number,
  offsetY: number,
): { x: number; y: number } {
  const inset = 36;
  let x = (pageWidth - contentWidth) / 2;
  let y = (pageHeight - contentHeight) / 2;

  switch (position) {
    case "top-left":
      x = inset;
      y = pageHeight - contentHeight - inset;
      break;
    case "top-right":
      x = pageWidth - contentWidth - inset;
      y = pageHeight - contentHeight - inset;
      break;
    case "bottom-left":
      x = inset;
      y = inset;
      break;
    case "bottom-right":
      x = pageWidth - contentWidth - inset;
      y = inset;
      break;
    case "center":
    default:
      break;
  }

  return {
    x: x + offsetX,
    y: y + offsetY,
  };
}

function parseHexColor(hex: string): RGB {
  const cleaned = hex.replace("#", "").trim();
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((part) => part + part)
          .join("")
      : cleaned;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    return rgb(0.45, 0.45, 0.45);
  }
  const value = Number.parseInt(full, 16);
  return rgb(
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  );
}

export function colorFromHex(hex: string): RGB {
  return parseHexColor(hex);
}

async function drawTextWatermark(
  page: PDFPage,
  options: TextWatermarkOptions,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
): Promise<void> {
  const text = options.text.trim();
  if (!text) {
    throw new PdfToolError("Enter watermark text.");
  }
  const size = Math.max(8, Math.min(options.fontSize, 200));
  const width = font.widthOfTextAtSize(text, size);
  const height = size;
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const { x, y } = watermarkPlacement(
    pageWidth,
    pageHeight,
    width,
    height,
    options.position,
    options.offsetX,
    options.offsetY,
  );
  page.drawText(text, {
    x,
    y,
    size,
    font,
    color: options.color,
    opacity: Math.min(1, Math.max(0.05, options.opacity)),
    rotate: degrees(options.rotation),
  });
}

async function drawImageWatermark(
  doc: PDFDocument,
  page: PDFPage,
  options: ImageWatermarkOptions,
): Promise<void> {
  const isPng =
    options.mime.includes("png") || options.name.toLowerCase().endsWith(".png");
  const embedded = isPng
    ? await doc.embedPng(options.bytes)
    : await doc.embedJpg(options.bytes);
  const scale = Math.min(3, Math.max(0.05, options.scale));
  const width = embedded.width * scale;
  const height = embedded.height * scale;
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const { x, y } = watermarkPlacement(
    pageWidth,
    pageHeight,
    width,
    height,
    options.position,
    options.offsetX,
    options.offsetY,
  );
  page.drawImage(embedded, {
    x,
    y,
    width,
    height,
    opacity: Math.min(1, Math.max(0.05, options.opacity)),
    rotate: degrees(options.rotation),
  });
}

export async function applyWatermark(
  bytes: ArrayBuffer,
  target: WatermarkPageTarget,
  options: WatermarkOptions,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes, {
    ignoreEncryption: false,
    updateMetadata: false,
  });
  const pages = resolveWatermarkPages(doc.getPageCount(), target);
  if (pages.length === 0) {
    throw new PdfToolError("Select at least one page for the watermark.");
  }

  const font =
    options.kind === "text"
      ? await doc.embedFont(StandardFonts.HelveticaBold)
      : null;

  for (const pageNumber of pages) {
    const page = doc.getPage(pageNumber - 1);
    if (options.kind === "text") {
      await drawTextWatermark(page, options, font!);
    } else {
      await drawImageWatermark(doc, page, options);
    }
  }

  return doc.save();
}
