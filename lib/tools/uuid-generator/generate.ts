export const MIN_UUID_COUNT = 1;
export const MAX_UUID_COUNT = 100;

export const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type UuidResult =
  | { ok: true; uuids: string[] }
  | { ok: false; message: string };

export function parseUuidCount(raw: string | number): UuidResult {
  const value = typeof raw === "number" ? raw : Number(raw.trim());

  if (!Number.isInteger(value)) {
    return {
      ok: false,
      message: `Enter a whole number from ${MIN_UUID_COUNT} to ${MAX_UUID_COUNT}.`,
    };
  }

  if (value < MIN_UUID_COUNT || value > MAX_UUID_COUNT) {
    return {
      ok: false,
      message: `You can generate between ${MIN_UUID_COUNT} and ${MAX_UUID_COUNT} UUIDs at a time.`,
    };
  }

  return { ok: true, uuids: [] };
}

export function generateUuids(count: number): UuidResult {
  const parsed = parseUuidCount(count);

  if (!parsed.ok) {
    return parsed;
  }

  if (typeof crypto.randomUUID !== "function") {
    return {
      ok: false,
      message: "This browser does not support crypto.randomUUID().",
    };
  }

  const uuids = Array.from({ length: count }, () => crypto.randomUUID());
  return { ok: true, uuids };
}
