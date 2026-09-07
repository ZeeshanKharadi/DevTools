const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const PHONE_PATTERN = /^[+\d][\d\s().-]{5,24}$/;
const DATA_IMAGE_PATTERN =
  /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=\s]+$/i;

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

export function trimField(value: string): string {
  return value.replace(/\s+/g, " ").trim();
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

export function mailtoHref(email: string): string {
  return `mailto:${email}`;
}

export function sanitizePhone(raw: string): string | null {
  const value = trimField(raw);

  if (!value || !PHONE_PATTERN.test(value)) {
    return null;
  }

  return value;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
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

export function displayHost(href: string): string {
  try {
    const url = new URL(href);
    return `${url.host}${url.pathname === "/" ? "" : url.pathname}`.replace(
      /\/$/,
      "",
    );
  } catch {
    return href;
  }
}

export function sanitizeDataImageUrl(raw: string): string | null {
  const value = raw.trim();

  if (!DATA_IMAGE_PATTERN.test(value)) {
    return null;
  }

  return value.replace(/\s+/g, "");
}

export function sanitizeImageSrc(raw: string): string | null {
  if (raw.startsWith("data:image/")) {
    return sanitizeDataImageUrl(raw);
  }

  return sanitizeHttpUrl(raw);
}

export function isLocalImageSrc(src: string): boolean {
  return src.startsWith("data:image/");
}
