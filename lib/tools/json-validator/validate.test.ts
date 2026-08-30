import { describe, expect, it } from "vitest";
import { JSON_VALIDATOR_EXAMPLE, validateJson } from "./index";

describe("JSON Validator", () => {
  it("accepts valid objects, arrays, and literals", () => {
    expect(validateJson('{"ok":true}').ok).toBe(true);
    expect(validateJson("[1,2,3]").ok).toBe(true);
    expect(validateJson("null").ok).toBe(true);
    expect(validateJson(JSON_VALIDATOR_EXAMPLE).ok).toBe(true);
  });

  it("rejects empty input", () => {
    expect(validateJson("")).toMatchObject({
      ok: false,
      message: "Enter JSON to continue.",
    });
  });

  it("reports a location for invalid JSON", () => {
    const result = validateJson('{"a":1,}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.line).toEqual(expect.any(Number));
      expect(result.column).toEqual(expect.any(Number));
      expect(result.message.toLowerCase()).not.toContain("stack");
    }
  });
});
