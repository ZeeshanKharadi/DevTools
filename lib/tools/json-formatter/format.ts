import { describeJsonError } from "./errors";
import type { JsonParseResult, JsonProcessResult } from "./types";

export function parseJson(input: string): JsonParseResult {
  if (input.trim() === "") {
    return {
      ok: false,
      message: "Enter JSON to continue.",
      line: null,
      column: null,
    };
  }

  try {
    return { ok: true, value: JSON.parse(input) };
  } catch (error) {
    return {
      ok: false,
      ...describeJsonError(input, error),
    };
  }
}

export function formatJson(input: string): JsonProcessResult {
  const parsed = parseJson(input);

  if (!parsed.ok) {
    return parsed;
  }

  return {
    ok: true,
    output: JSON.stringify(parsed.value, null, 2),
  };
}

export function minifyJson(input: string): JsonProcessResult {
  const parsed = parseJson(input);

  if (!parsed.ok) {
    return parsed;
  }

  return {
    ok: true,
    output: JSON.stringify(parsed.value),
  };
}

export function validateJson(input: string): JsonParseResult {
  return parseJson(input);
}
