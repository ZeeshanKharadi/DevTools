export const MAX_PDF_BYTES = 50 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_MERGE_FILES = 30;
export const MAX_IMAGE_FILES = 40;
export const PREVIEW_SCALE = 0.35;
export const RENDER_SCALE_DEFAULT = 1.5;

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"] as const;
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const decimals = unit === 0 || value >= 10 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[unit]}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function bytesToPdfBlob(bytes: Uint8Array): Blob {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy.buffer], { type: "application/pdf" });
}

export function revokeObjectUrl(url: string | null | undefined): void {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export function isPdfMime(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return type === "application/pdf" || name.endsWith(".pdf");
}

export function isImageMime(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type === "image/jpeg" ||
    type === "image/jpg" ||
    type === "image/png" ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png")
  );
}

/**
 * Parse expressions like "1-3,5,8-10" into unique 1-based page numbers.
 */
export function parsePageRanges(
  expression: string,
  pageCount: number,
): { pages: number[]; error: string | null } {
  const trimmed = expression.trim();
  if (!trimmed) {
    return { pages: [], error: "Enter at least one page or range." };
  }
  if (!/^[0-9,\-\s]+$/.test(trimmed)) {
    return {
      pages: [],
      error: "Use digits, commas, and hyphens only (example: 1-3,5,8-10).",
    };
  }

  const parts = trimmed.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) {
    return { pages: [], error: "Enter at least one page or range." };
  }

  const selected = new Set<number>();
  for (const part of parts) {
    if (part.includes("-")) {
      const [startRaw, endRaw, extra] = part.split("-");
      if (extra !== undefined || !startRaw || !endRaw) {
        return { pages: [], error: `Invalid range "${part}".` };
      }
      const start = Number(startRaw);
      const end = Number(endRaw);
      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < 1 ||
        end < 1
      ) {
        return { pages: [], error: `Invalid range "${part}".` };
      }
      if (start > end) {
        return {
          pages: [],
          error: `Range "${part}" is reversed. Use a smaller number first.`,
        };
      }
      if (end > pageCount) {
        return {
          pages: [],
          error: `Page ${end} is beyond this document (${pageCount} pages).`,
        };
      }
      for (let page = start; page <= end; page += 1) {
        selected.add(page);
      }
    } else {
      const page = Number(part);
      if (!Number.isInteger(page) || page < 1) {
        return { pages: [], error: `Invalid page "${part}".` };
      }
      if (page > pageCount) {
        return {
          pages: [],
          error: `Page ${page} is beyond this document (${pageCount} pages).`,
        };
      }
      selected.add(page);
    }
  }

  return {
    pages: [...selected].sort((a, b) => a - b),
    error: null,
  };
}
