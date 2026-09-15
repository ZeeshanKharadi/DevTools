const HASH_ALGORITHM = "pbkdf2-hmac-sha256";
const HASH_VERSION = 1;
export const PBKDF2_ITERATIONS = 100_000;
const MAX_VERIFY_ITERATIONS = 5_000_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

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

async function derive(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations,
    },
    key,
    KEY_BITS,
  );
  return new Uint8Array(bits);
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

function parseIterations(raw: string): number | null {
  if (!/^[0-9]+$/.test(raw)) {
    return null;
  }

  const iterations = Number(raw);
  if (
    !Number.isSafeInteger(iterations) ||
    iterations < 1 ||
    iterations > MAX_VERIFY_ITERATIONS
  ) {
    return null;
  }

  return iterations;
}

export async function hashPasswordWithIterations(
  password: string,
  iterations: number,
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, iterations);
  return `${HASH_ALGORITHM}$${HASH_VERSION}$${iterations}$${bytesToB64(salt)}$${bytesToB64(hash)}`;
}

export async function hashPassword(password: string): Promise<string> {
  return hashPasswordWithIterations(password, PBKDF2_ITERATIONS);
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (
    parts.length !== 5 ||
    parts[0] !== HASH_ALGORITHM ||
    parts[1] !== String(HASH_VERSION)
  ) {
    return false;
  }

  const iterations = parseIterations(parts[2]);
  if (iterations === null) {
    return false;
  }

  const salt = b64ToBytes(parts[3]);
  const expected = b64ToBytes(parts[4]);
  const actual = await derive(password, salt, iterations);
  return timingSafeEqual(actual, expected);
}
