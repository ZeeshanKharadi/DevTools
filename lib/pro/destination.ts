export function sanitizeDestinationUrl(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2048) {
    return null;
  }

  if (/[\u0000-\u001F\u007F]/.test(trimmed)) {
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

  if (/[\u0000-\u001F\u007F]/.test(url.toString())) {
    return null;
  }

  return url.toString();
}
