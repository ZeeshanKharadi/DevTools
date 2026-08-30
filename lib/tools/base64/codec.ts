export type Base64Result =
  | { ok: true; output: string }
  | { ok: false; message: string };

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function base64ToBytes(encoded: string): Uint8Array {
  const compact = encoded.replace(/\s+/g, "");

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) {
    throw new Error("Invalid Base64.");
  }

  const binary = atob(compact);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function encodeBase64(text: string): Base64Result {
  if (text.length === 0) {
    return { ok: false, message: "Enter text to encode." };
  }

  const bytes = new TextEncoder().encode(text);
  return { ok: true, output: bytesToBase64(bytes) };
}

export function decodeBase64(encoded: string): Base64Result {
  if (encoded.trim().length === 0) {
    return { ok: false, message: "Enter Base64 to decode." };
  }

  try {
    const bytes = base64ToBytes(encoded);
    return { ok: true, output: new TextDecoder().decode(bytes) };
  } catch {
    return {
      ok: false,
      message: "This is not valid Base64. Check for missing characters or extra symbols.",
    };
  }
}

export const BASE64_EXAMPLE = "Hello, 世界";
