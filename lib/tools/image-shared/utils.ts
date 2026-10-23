export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_BATCH_IMAGES = 40;
export const MAX_OUTPUT_DIMENSION = 10000;

export type ImageOutputFormat = "image/jpeg" | "image/png" | "image/webp";

export type LoadedImage = {
  id: string;
  file: File;
  name: string;
  size: number;
  width: number;
  height: number;
  mime: string;
  objectUrl: string;
  bitmap: ImageBitmap | HTMLImageElement;
};

export class ImageToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageToolError";
  }
}

export function createImageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `img-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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

export function isSupportedImageMime(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type === "image/jpeg" ||
    type === "image/jpg" ||
    type === "image/png" ||
    type === "image/webp" ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp")
  );
}

export function extensionForMime(mime: ImageOutputFormat): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

export function mimeFromFile(file: File): ImageOutputFormat | null {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (type === "image/png" || name.endsWith(".png")) return "image/png";
  if (type === "image/webp" || name.endsWith(".webp")) return "image/webp";
  if (
    type === "image/jpeg" ||
    type === "image/jpg" ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg")
  ) {
    return "image/jpeg";
  }
  return null;
}

export function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, "") || "image";
}

export function safeBaseName(filename: string): string {
  return stripExtension(filename)
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "image";
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function revokeObjectUrl(url: string | null | undefined): void {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export function percentSaved(original: number, result: number): number {
  if (original <= 0) {
    return 0;
  }
  return ((original - result) / original) * 100;
}

export function computeAspectSize(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number | null,
  targetHeight: number | null,
  lockAspect: boolean,
): { width: number; height: number } {
  if (!lockAspect) {
    return {
      width: Math.max(1, Math.round(targetWidth ?? sourceWidth)),
      height: Math.max(1, Math.round(targetHeight ?? sourceHeight)),
    };
  }
  if (targetWidth && !targetHeight) {
    const width = Math.max(1, Math.round(targetWidth));
    return {
      width,
      height: Math.max(1, Math.round((sourceHeight / sourceWidth) * width)),
    };
  }
  if (targetHeight && !targetWidth) {
    const height = Math.max(1, Math.round(targetHeight));
    return {
      width: Math.max(1, Math.round((sourceWidth / sourceHeight) * height)),
      height,
    };
  }
  if (targetWidth && targetHeight) {
    const widthScale = targetWidth / sourceWidth;
    const heightScale = targetHeight / sourceHeight;
    const scale = Math.min(widthScale, heightScale);
    return {
      width: Math.max(1, Math.round(sourceWidth * scale)),
      height: Math.max(1, Math.round(sourceHeight * scale)),
    };
  }
  return { width: sourceWidth, height: sourceHeight };
}

export function sizeFromPercent(
  sourceWidth: number,
  sourceHeight: number,
  percent: number,
): { width: number; height: number } {
  const scale = percent / 100;
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
  };
}
