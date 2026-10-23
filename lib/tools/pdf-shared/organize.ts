import { PDFDocument, degrees } from "pdf-lib";
import { PdfToolError } from "./operations";

export type OrganizedPage = {
  id: string;
  /** 0-based index in the source PDF */
  sourceIndex: number;
  /** Additional rotation relative to the source page (0 | 90 | 180 | 270) */
  rotation: number;
};

function createPageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `page-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createOrganizedPages(pageCount: number): OrganizedPage[] {
  return Array.from({ length: pageCount }, (_, sourceIndex) => ({
    id: createPageId(),
    sourceIndex,
    rotation: 0,
  }));
}

export function normalizeRotation(value: number): number {
  const normalized = ((value % 360) + 360) % 360;
  return normalized;
}

export function moveOrganizedPage(
  pages: OrganizedPage[],
  id: string,
  toIndex: number,
): OrganizedPage[] {
  const fromIndex = pages.findIndex((page) => page.id === id);
  if (fromIndex < 0) {
    return pages;
  }
  const clamped = Math.max(0, Math.min(toIndex, pages.length - 1));
  if (fromIndex === clamped) {
    return pages;
  }
  const next = [...pages];
  const [item] = next.splice(fromIndex, 1);
  next.splice(clamped, 0, item);
  return next;
}

export function duplicateOrganizedPage(
  pages: OrganizedPage[],
  id: string,
): OrganizedPage[] {
  const index = pages.findIndex((page) => page.id === id);
  if (index < 0) {
    return pages;
  }
  const source = pages[index]!;
  const copy: OrganizedPage = {
    id: createPageId(),
    sourceIndex: source.sourceIndex,
    rotation: source.rotation,
  };
  const next = [...pages];
  next.splice(index + 1, 0, copy);
  return next;
}

export function deleteOrganizedPages(
  pages: OrganizedPage[],
  ids: Iterable<string>,
): OrganizedPage[] {
  const remove = new Set(ids);
  return pages.filter((page) => !remove.has(page.id));
}

export async function exportOrganizedPdf(
  bytes: ArrayBuffer,
  pages: OrganizedPage[],
): Promise<Uint8Array> {
  if (pages.length === 0) {
    throw new PdfToolError("Add at least one page before exporting.");
  }

  const source = await PDFDocument.load(bytes, {
    ignoreEncryption: false,
    updateMetadata: false,
  });
  const sourceCount = source.getPageCount();
  const output = await PDFDocument.create();

  for (const item of pages) {
    if (item.sourceIndex < 0 || item.sourceIndex >= sourceCount) {
      throw new PdfToolError(`Source page ${item.sourceIndex + 1} is missing.`);
    }
    const [copied] = await output.copyPages(source, [item.sourceIndex]);
    const rotation = normalizeRotation(item.rotation);
    if (rotation !== 0) {
      const current = copied.getRotation().angle;
      copied.setRotation(degrees(normalizeRotation(current + rotation)));
    }
    output.addPage(copied);
  }

  return output.save();
}
