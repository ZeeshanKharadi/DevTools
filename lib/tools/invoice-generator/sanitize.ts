const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const PHONE_PATTERN = /^[+\d][\d\s().-]{5,24}$/;
const DATA_IMAGE_PATTERN =
  /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=\s]+$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

export function stripControlChars(value: string): string {
  return value.replace(CONTROL_CHARS, "");
}

export function trimField(value: string): string {
  return stripControlChars(value).replace(/\s+/g, " ").trim();
}

export function trimMultiline(value: string): string {
  return stripControlChars(value)
    .replace(/\r\n/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function capMultiline(
  value: string,
  max: number,
): { text: string; trimmed: boolean } {
  const text = trimMultiline(value);
  if (text.length <= max) {
    return { text, trimmed: false };
  }
  return { text: text.slice(0, max).trimEnd(), trimmed: true };
}

export function present(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
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

  return url.toString();
}

export function sanitizeDataImageUrl(raw: string): string | null {
  const value = raw.trim().replace(/\s+/g, "");

  if (!DATA_IMAGE_PATTERN.test(value)) {
    return null;
  }

  return value;
}

export function sanitizeIsoDate(raw: string): string | null {
  const value = raw.trim();

  if (!DATE_PATTERN.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return value;
}

export function formatIsoDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
