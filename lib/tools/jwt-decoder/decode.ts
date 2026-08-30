export type JwtTimeClaim = {
  claim: "exp" | "iat" | "nbf";
  label: string;
  unix: number;
  local: string;
  utc: string;
};

export type JwtDecodeSuccess = {
  ok: true;
  header: unknown;
  payload: unknown;
  headerText: string;
  payloadText: string;
  times: JwtTimeClaim[];
  signaturePresent: boolean;
};

export type JwtDecodeError = {
  ok: false;
  message: string;
};

export type JwtDecodeResult = JwtDecodeSuccess | JwtDecodeError;

const TIME_CLAIMS = [
  { claim: "exp" as const, label: "Expiration (exp)" },
  { claim: "iat" as const, label: "Issued at (iat)" },
  { claim: "nbf" as const, label: "Not before (nbf)" },
];

export function decodeBase64Url(input: string): string {
  if (!/^[A-Za-z0-9_-]*$/.test(input)) {
    throw new Error("Invalid base64url.");
  }

  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function formatJwtTime(
  value: unknown,
): Omit<JwtTimeClaim, "claim" | "label"> | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const milliseconds = Math.abs(value) < 1e12 ? value * 1000 : value;
  const date = new Date(milliseconds);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    unix: value,
    local: date.toLocaleString(),
    utc: date.toUTCString(),
  };
}

export function extractJwtTimes(payload: unknown): JwtTimeClaim[] {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const times: JwtTimeClaim[] = [];

  for (const item of TIME_CLAIMS) {
    const formatted = formatJwtTime(record[item.claim]);

    if (formatted) {
      times.push({ ...item, ...formatted });
    }
  }

  return times;
}

function decodePart(
  label: string,
  part: string,
): { ok: true; value: unknown } | { ok: false; message: string } {
  let text: string;

  try {
    text = decodeBase64Url(part);
  } catch {
    return { ok: false, message: `The ${label} is not valid base64url.` };
  }

  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, message: `The ${label} is not valid JSON.` };
  }
}

export function decodeJwt(token: string): JwtDecodeResult {
  const trimmed = token.trim().replace(/^Bearer\s+/i, "");

  if (!trimmed) {
    return { ok: false, message: "Enter a JWT to decode." };
  }

  const parts = trimmed.split(".");

  if (parts.length < 2 || !parts[0] || !parts[1]) {
    return {
      ok: false,
      message: "A JWT must have a header and a payload separated by dots.",
    };
  }

  if (parts.length > 3) {
    return {
      ok: false,
      message: "This value has too many dot-separated parts to be a JWT.",
    };
  }

  const header = decodePart("header", parts[0]);
  if (!header.ok) {
    return header;
  }

  const payload = decodePart("payload", parts[1]);
  if (!payload.ok) {
    return payload;
  }

  return {
    ok: true,
    header: header.value,
    payload: payload.value,
    headerText: JSON.stringify(header.value, null, 2),
    payloadText: JSON.stringify(payload.value, null, 2),
    times: extractJwtTimes(payload.value),
    signaturePresent: Boolean(parts[2]),
  };
}

export const JWT_DECODER_EXAMPLE = [
  encodeBase64Url(JSON.stringify({ alg: "none", typ: "JWT" })),
  encodeBase64Url(
    JSON.stringify({
      sub: "user-1001",
      name: "Ada Lovelace",
      iat: 1516239022,
      exp: 1916239022,
    }),
  ),
  "",
].join(".");
