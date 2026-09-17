const HASH_ALGORITHM = "hmac-sha256";
const HASH_VERSION = 1;
const SALT_BYTES = 16;
const OTP_MODULUS = 1_000_000;
const UINT32_RANGE = 0x1_0000_0000;
const REJECT_LIMIT = Math.floor(UINT32_RANGE / OTP_MODULUS) * OTP_MODULUS;

export const OTP_DIGITS = 6;
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_FAILED_ATTEMPTS = 5;

function bytesToB64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function b64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function randomUint32(): number {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return (
    ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0
  );
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }

  return diff === 0;
}

async function hmacSha256(
  keyBytes: Uint8Array<ArrayBuffer>,
  message: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return new Uint8Array(signature);
}

export function generateOtp(): string {
  let value = randomUint32();
  while (value >= REJECT_LIMIT) {
    value = randomUint32();
  }

  return String(value % OTP_MODULUS).padStart(OTP_DIGITS, "0");
}

export function normalizeOtp(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  const digits = raw.replace(/\s+/g, "");
  if (!new RegExp(`^[0-9]{${OTP_DIGITS}}$`).test(digits)) {
    return null;
  }

  return digits;
}

export async function hashOtp(otp: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const mac = await hmacSha256(salt, otp);
  return `${HASH_ALGORITHM}$${HASH_VERSION}$${bytesToB64(salt)}$${bytesToB64(mac)}`;
}

export async function verifyOtp(otp: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (
    parts.length !== 4 ||
    parts[0] !== HASH_ALGORITHM ||
    parts[1] !== String(HASH_VERSION)
  ) {
    return false;
  }

  try {
    const salt = b64ToBytes(parts[2]);
    const expected = b64ToBytes(parts[3]);
    const actual = await hmacSha256(salt, otp);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

let dummyHashPromise: Promise<string> | null = null;

export async function dummyOtpCompare(otp: string): Promise<boolean> {
  dummyHashPromise ??= hashOtp(generateOtp());
  const dummy = await dummyHashPromise;
  return verifyOtp(otp, dummy);
}
