export function parseOptionalText(raw: unknown, max = 200): string {
  if (typeof raw !== "string") {
    return "";
  }

  return raw.replace(/\s+/g, " ").trim().slice(0, max);
}

export function copyRecordName(name: string, max = 80): string {
  return name.startsWith("Copy of ") ? name : `Copy of ${name}`.slice(0, max);
}

export function parseName(raw: unknown, max = 80): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  const name = raw.replace(/\s+/g, " ").trim().slice(0, max);
  return name.length > 0 ? name : null;
}

export function createPublicCode(length = 10): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const limit = 256 - (256 % alphabet.length);
  let value = "";
  while (value.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length - value.length));
    for (const byte of bytes) {
      if (byte >= limit) {
        continue;
      }
      value += alphabet[byte % alphabet.length];
      if (value.length === length) {
        break;
      }
    }
  }
  return value;
}

export function parsePublicCode(raw: string): string | null {
  const code = raw.trim().toLowerCase();
  if (!/^[a-z0-9]{8,16}$/.test(code)) {
    return null;
  }
  return code;
}

/** Returns the boolean, `undefined` if omitted, or `null` if the value is not a boolean. */
export function parseOptionalFlag(raw: unknown): boolean | undefined | null {
  if (raw === undefined) {
    return undefined;
  }
  if (typeof raw === "boolean") {
    return raw;
  }
  return null;
}

export function parseSlug(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  const slug = raw.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 3 || slug.length > 40) {
    return null;
  }

  return slug;
}

export function slugifyName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return slug.length >= 3 ? slug : createPublicCode(8);
}

export function isUniqueConstraintError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /unique/i.test(message);
}

export function createId(): string {
  return crypto.randomUUID();
}

export function normalizeEmail(raw: string): string | null {
  const value = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 254) {
    return null;
  }

  if (/[<>"'\\]/.test(value)) {
    return null;
  }

  return value;
}

export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 128;

export function validatePassword(password: string, email?: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`;
  }

  if (email && password.trim().toLowerCase() === email.trim().toLowerCase()) {
    return "Password cannot be the same as your email.";
  }

  return null;
}
