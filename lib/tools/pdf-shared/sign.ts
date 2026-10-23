import { PDFDocument, degrees } from "pdf-lib";
import { PdfToolError } from "./operations";

export type SignaturePlacement = {
  /** 1-based page number */
  page: number;
  /** Top-left of signature in preview CSS pixels */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Preview element size in CSS pixels */
  previewWidth: number;
  previewHeight: number;
};

export type SignatureImage = {
  bytes: ArrayBuffer;
  mime: string;
  name: string;
};

export type PdfDrawBox = {
  /** Lower-left origin of the image before pdf-lib rotation */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Counter-rotation so the stamp stays visually upright on rotated pages */
  rotate: number;
};

/**
 * Visual (CSS, top-left, y-down) → PDF user space (bottom-left, y-up),
 * accounting for page /Rotate. Returns draw params for pdf-lib `drawImage`,
 * including counter-rotation so the stamp matches the on-screen overlay.
 */
export function mapPreviewRectToPdf(
  placement: Omit<SignaturePlacement, "page">,
  pageWidth: number,
  pageHeight: number,
  pageRotation: number,
): PdfDrawBox {
  const { left, top, width, height, previewWidth, previewHeight } = placement;
  if (previewWidth <= 0 || previewHeight <= 0) {
    throw new PdfToolError("Invalid preview size for signature placement.");
  }
  if (width <= 0 || height <= 0) {
    throw new PdfToolError("Signature size must be positive.");
  }

  const rot = ((pageRotation % 360) + 360) % 360;
  // Normalized visual fractions (origin top-left, y down) — PDF.js preview space.
  const fx = left / previewWidth;
  const fy = top / previewHeight;
  const fw = width / previewWidth;
  const fh = height / previewHeight;

  // Visual page size after /Rotate (matches PDF.js getViewport).
  const visualWidth = rot === 90 || rot === 270 ? pageHeight : pageWidth;
  const visualHeight = rot === 90 || rot === 270 ? pageWidth : pageHeight;

  const vx0 = fx * visualWidth;
  const vy0 = fy * visualHeight;
  const vx1 = (fx + fw) * visualWidth;
  const vy1 = (fy + fh) * visualHeight;

  // Map visual corners (top-left y-down) into unrotated PDF user space.
  const corners = [
    visualPointToPdf(vx0, vy0, visualWidth, visualHeight, pageWidth, pageHeight, rot),
    visualPointToPdf(vx1, vy0, visualWidth, visualHeight, pageWidth, pageHeight, rot),
    visualPointToPdf(vx0, vy1, visualWidth, visualHeight, pageWidth, pageHeight, rot),
    visualPointToPdf(vx1, vy1, visualWidth, visualHeight, pageWidth, pageHeight, rot),
  ];

  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  // Counter-rotate the stamp so it stays upright on screen after page /Rotate.
  const rotate = rot === 0 ? 0 : -rot;

  if (rot === 0) {
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      rotate: 0,
    };
  }

  // pdf-lib rotates the image around its lower-left (x, y). Choose (x, y) so the
  // axis-aligned visual rect maps to the bounding box computed above after rotation.
  if (rot === 90) {
    // Image drawn with rotate -90° (270°): extends left and up from origin in user space.
    // Visual width → PDF height, visual height → PDF width.
    const drawWidth = maxY - minY;
    const drawHeight = maxX - minX;
    return {
      x: maxX,
      y: minY,
      width: drawWidth,
      height: drawHeight,
      rotate,
    };
  }

  if (rot === 180) {
    const drawWidth = maxX - minX;
    const drawHeight = maxY - minY;
    return {
      x: maxX,
      y: maxY,
      width: drawWidth,
      height: drawHeight,
      rotate,
    };
  }

  // 270
  const drawWidth = maxY - minY;
  const drawHeight = maxX - minX;
  return {
    x: minX,
    y: maxY,
    width: drawWidth,
    height: drawHeight,
    rotate,
  };
}

function visualPointToPdf(
  vx: number,
  vy: number,
  visualWidth: number,
  visualHeight: number,
  pageWidth: number,
  pageHeight: number,
  rot: number,
): { x: number; y: number } {
  const nx = visualWidth > 0 ? vx / visualWidth : 0;
  const ny = visualHeight > 0 ? vy / visualHeight : 0;

  if (rot === 90) {
    // Visual x → PDF +y; visual y (down) → PDF -x from the right edge.
    return {
      x: (1 - ny) * pageWidth,
      y: nx * pageHeight,
    };
  }
  if (rot === 180) {
    return {
      x: (1 - nx) * pageWidth,
      y: ny * pageHeight,
    };
  }
  if (rot === 270) {
    return {
      x: ny * pageWidth,
      y: (1 - nx) * pageHeight,
    };
  }
  return {
    x: nx * pageWidth,
    y: (1 - ny) * pageHeight,
  };
}

export async function embedSignatures(
  pdfBytes: ArrayBuffer,
  signature: SignatureImage,
  placements: SignaturePlacement[],
): Promise<Uint8Array> {
  if (placements.length === 0) {
    throw new PdfToolError("Place at least one signature on the document.");
  }

  const doc = await PDFDocument.load(pdfBytes, {
    ignoreEncryption: false,
    updateMetadata: false,
  });
  const isPng =
    signature.mime.includes("png") ||
    signature.name.toLowerCase().endsWith(".png");
  const image = isPng
    ? await doc.embedPng(signature.bytes)
    : await doc.embedJpg(signature.bytes);

  const pageCount = doc.getPageCount();
  for (const placement of placements) {
    if (placement.page < 1 || placement.page > pageCount) {
      throw new PdfToolError(`Page ${placement.page} is out of range.`);
    }
    const page = doc.getPage(placement.page - 1);
    const size = page.getSize();
    const rotation = page.getRotation().angle;
    const box = mapPreviewRectToPdf(
      placement,
      size.width,
      size.height,
      rotation,
    );
    page.drawImage(image, {
      x: box.x,
      y: box.y,
      width: Math.max(box.width, 1),
      height: Math.max(box.height, 1),
      rotate: degrees(box.rotate),
    });
  }

  return doc.save();
}

/** Render typed text to a PNG ArrayBuffer using an offscreen canvas. */
export async function renderTypedSignaturePng(
  text: string,
  fontFamily: string,
  color: string,
): Promise<ArrayBuffer> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new PdfToolError("Enter a name for the typed signature.");
  }
  if (typeof document === "undefined") {
    throw new PdfToolError("Typed signatures require a browser canvas.");
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new PdfToolError("Could not create a canvas for the signature.");
  }

  const fontSize = 64;
  context.font = `italic ${fontSize}px ${fontFamily}`;
  const metrics = context.measureText(trimmed);
  const padding = 24;
  canvas.width = Math.ceil(metrics.width + padding * 2);
  canvas.height = Math.ceil(fontSize * 1.6 + padding);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = `italic ${fontSize}px ${fontFamily}`;
  context.fillStyle = color;
  context.textBaseline = "middle";
  context.fillText(trimmed, padding, canvas.height / 2);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new PdfToolError("Could not export the typed signature."));
          return;
        }
        resolve(result);
      },
      "image/png",
    );
  });
  return blob.arrayBuffer();
}
