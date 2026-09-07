import {
  DEFAULT_BACKGROUND,
  DEFAULT_FOREGROUND,
  DEFAULT_ERROR_CORRECTION,
  DEFAULT_QR_MARGIN,
  DEFAULT_QR_SIZE,
  MAX_LOGO_BYTES,
  MAX_QR_MARGIN,
  MAX_QR_SIZE,
  MIN_QR_MARGIN,
  MIN_QR_SIZE,
} from "./constants";
import { isQrErrorCorrection } from "./constants";
import type { QrErrorCorrection } from "./types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const PHONE_PATTERN = /^[+\d][\d\s().-]{5,24}$/;
const DATA_IMAGE_PATTERN =
  /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=\s]+$/i;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function trimField(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function stripControlChars(value: string): string {
  return value.replace(CONTROL_CHARS, "");
}

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function sanitizeColor(raw: string, fallback: string): string {
  const value = raw.trim();

  if (!COLOR_PATTERN.test(value)) {
    return fallback;
  }

  if (value.length === 4) {
    const [, r, g, b] = value;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return value.toLowerCase();
}

export function clampInt(
  value: number,
  min: number,
  max: number,
  fallback: number,
): number {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

export function sanitizeQrSize(value: number): number {
  return clampInt(value, MIN_QR_SIZE, MAX_QR_SIZE, DEFAULT_QR_SIZE);
}

export function sanitizeQrMargin(value: number): number {
  return clampInt(value, MIN_QR_MARGIN, MAX_QR_MARGIN, DEFAULT_QR_MARGIN);
}

export function sanitizeErrorCorrection(
  value: string,
): QrErrorCorrection {
  return isQrErrorCorrection(value) ? value : DEFAULT_ERROR_CORRECTION;
}

export function sanitizeEmail(raw: string): string | null {
  const value = trimField(raw);

  if (!value || !EMAIL_PATTERN.test(value) || /[<>"'\\]/.test(value)) {
    return null;
  }

  return value;
}

export function sanitizePhone(raw: string): string | null {
  const value = trimField(raw);

  if (!value || !PHONE_PATTERN.test(value)) {
    return null;
  }

  return value;
}

export function telDigits(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export function sanitizeHttpUrl(raw: string): string | null {
  const trimmed = trimField(raw);

  if (!trimmed) {
    return null;
  }

  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;

  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  if (url.username || url.password) {
    return null;
  }

  if (url.hostname === "localhost" || url.hostname.endsWith(".localhost")) {
    return null;
  }

  return url.toString();
}

export function sanitizeDataImageUrl(raw: string): string | null {
  const value = raw.trim().replace(/\s+/g, "");

  if (!DATA_IMAGE_PATTERN.test(value)) {
    return null;
  }

  const comma = value.indexOf(",");
  const encoded = value.slice(comma + 1);
  const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
  const bytes = Math.floor((encoded.length * 3) / 4) - padding;

  if (bytes > MAX_LOGO_BYTES) {
    return null;
  }

  return value;
}

function srgbChannel(value: number): number {
  const channel = value / 255;
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = srgbChannel((n >> 16) & 255);
  const g = srgbChannel((n >> 8) & 255);
  const b = srgbChannel(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground: string, background: string): number {
  const fg = sanitizeColor(foreground, DEFAULT_FOREGROUND);
  const bg = sanitizeColor(background, DEFAULT_BACKGROUND);
  const lighter = Math.max(relativeLuminance(fg), relativeLuminance(bg));
  const darker = Math.min(relativeLuminance(fg), relativeLuminance(bg));
  return (lighter + 0.05) / (darker + 0.05);
}

export function escapeWifiValue(value: string): string {
  return stripControlChars(value).replace(/([\\;,:\"])/g, "\\$1");
}

export function escapeVCardValue(value: string): string {
  return stripControlChars(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export function foldVCardLine(line: string): string {
  if (utf8ByteLength(line) <= 75) {
    return line;
  }

  const chars = [...line];
  const folded: string[] = [];
  let current = "";

  for (const char of chars) {
    const next = current + char;
    const limit = folded.length === 0 ? 75 : 74;

    if (utf8ByteLength(next) > limit) {
      folded.push(current);
      current = char;
    } else {
      current = next;
    }
  }

  if (current) {
    folded.push(current);
  }

  return folded
    .map((part, index) => (index === 0 ? part : ` ${part}`))
    .join("\r\n");
}
