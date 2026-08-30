export type UrlCodecResult =
  | { ok: true; output: string }
  | { ok: false; message: string };

export function encodeUrl(text: string): UrlCodecResult {
  if (text.length === 0) {
    return { ok: false, message: "Enter text to encode." };
  }

  return { ok: true, output: encodeURIComponent(text) };
}

export function decodeUrl(text: string): UrlCodecResult {
  if (text.trim().length === 0) {
    return { ok: false, message: "Enter a URL-encoded string to decode." };
  }

  try {
    return { ok: true, output: decodeURIComponent(text) };
  } catch {
    return {
      ok: false,
      message:
        "This is not a valid URL-encoded string. Look for incomplete % sequences.",
    };
  }
}

export const URL_ENCODER_EXAMPLE = "search query: café & more";
