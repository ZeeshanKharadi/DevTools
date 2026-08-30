import { describe, expect, it } from "vitest";
import {
  JSON_FORMATTER_EXAMPLE,
  MAX_JSON_INPUT_SIZE,
  WARN_JSON_INPUT_SIZE,
  describeJsonError,
  formatJson,
  getJsonInputSizeWarning,
  locateJsonSyntaxError,
  minifyJson,
  parseJson,
  positionToLineColumn,
  validateJson,
} from "./index";

describe("parseJson / validateJson", () => {
  it("parses an object", () => {
    const result = parseJson('{"name":"Ada"}');
    expect(result).toEqual({ ok: true, value: { name: "Ada" } });
  });

  it("parses an array", () => {
    const result = parseJson("[1, 2, 3]");
    expect(result).toEqual({ ok: true, value: [1, 2, 3] });
  });

  it("parses nested objects", () => {
    const result = parseJson('{"user":{"id":1,"roles":["admin"]}}');
    expect(result).toEqual({
      ok: true,
      value: { user: { id: 1, roles: ["admin"] } },
    });
  });

  it("parses strings, numbers, booleans, and null", () => {
    const result = parseJson(
      '{"label":"ok","count":12.5,"active":true,"deleted":false,"meta":null}',
    );
    expect(result).toEqual({
      ok: true,
      value: {
        label: "ok",
        count: 12.5,
        active: true,
        deleted: false,
        meta: null,
      },
    });
  });

  it("parses unicode strings", () => {
    const result = parseJson('{"city":"München","mark":"✓"}');
    expect(result).toEqual({ ok: true, value: { city: "München", mark: "✓" } });
  });

  it("parses an empty object and empty array", () => {
    expect(parseJson("{}")).toEqual({ ok: true, value: {} });
    expect(parseJson("[]")).toEqual({ ok: true, value: [] });
  });

  it("rejects empty and whitespace-only input", () => {
    expect(parseJson("")).toMatchObject({
      ok: false,
      message: "Enter JSON to continue.",
      line: null,
      column: null,
    });
    expect(validateJson("  \n\t  ")).toMatchObject({
      ok: false,
      message: "Enter JSON to continue.",
    });
  });

  it("rejects a missing comma", () => {
    const result = parseJson('{"a":1 "b":2}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.line).toEqual(expect.any(Number));
      expect(result.column).toEqual(expect.any(Number));
      expect(result.message.toLowerCase()).not.toContain("at position");
    }
  });

  it("rejects a missing closing brace", () => {
    const result = parseJson('{"a":1');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message.length).toBeGreaterThan(0);
      expect(result.line).not.toBeNull();
    }
  });

  it("rejects an invalid string", () => {
    const result = parseJson('{"a": "unterminated}');
    expect(result.ok).toBe(false);
  });

  it("rejects an invalid value", () => {
    const result = parseJson('{"a": undefined}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message.toLowerCase()).not.toContain("stack");
    }
  });

  it("rejects a trailing comma", () => {
    const result = parseJson('{"a":1,}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.line).toBe(1);
      expect(result.column).toBeGreaterThan(0);
    }
  });
});

describe("formatJson", () => {
  it("pretty-prints compact JSON with 2-space indentation", () => {
    const result = formatJson('{"a":1,"b":[true,false]}');
    expect(result).toEqual({
      ok: true,
      output: `{
  "a": 1,
  "b": [
    true,
    false
  ]
}`,
    });
  });

  it("formats the documented object example", () => {
    const result = formatJson('{"name":"John","age":30,"active":true}');
    expect(result).toEqual({
      ok: true,
      output: `{
  "name": "John",
  "age": 30,
  "active": true
}`,
    });
  });

  it("does not modify invalid input beyond returning an error", () => {
    const input = '{"name":}';
    const result = formatJson(input);
    expect(result.ok).toBe(false);
  });

  it("formats deeply nested JSON", () => {
    let json = "0";

    for (let depth = 0; depth < 40; depth += 1) {
      json = `{"n":${json}}`;
    }

    const result = formatJson(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.parse(result.output)).toEqual(JSON.parse(json));
    }
  });

  it("formats a large string value", () => {
    const large = "x".repeat(10_000);
    const result = formatJson(JSON.stringify({ large }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.parse(result.output)).toEqual({ large });
    }
  });
});

describe("minifyJson", () => {
  it("minifies pretty JSON", () => {
    const result = minifyJson(`{
  "name": "John",
  "age": 30
}`);
    expect(result).toEqual({
      ok: true,
      output: '{"name":"John","age":30}',
    });
  });

  it("returns an error for invalid JSON", () => {
    const result = minifyJson("{");
    expect(result.ok).toBe(false);
  });
});

describe("error location", () => {
  it("maps a character index to line and column", () => {
    const input = "ab\ncd\nef";
    expect(positionToLineColumn(input, 0)).toEqual({ line: 1, column: 1 });
    expect(positionToLineColumn(input, 2)).toEqual({ line: 1, column: 3 });
    expect(positionToLineColumn(input, 3)).toEqual({ line: 2, column: 1 });
    expect(positionToLineColumn(input, 7)).toEqual({ line: 3, column: 2 });
  });

  it("reads line and column from an engine message when present", () => {
    const described = describeJsonError("{\n  1\n}", new SyntaxError("Bad token (line 2 column 3)"));
    expect(described).toEqual({
      message: "Bad token",
      line: 2,
      column: 3,
    });
  });

  it("converts a position in the engine message to line and column", () => {
    const input = "{\n  1}";
    const described = describeJsonError(
      input,
      new SyntaxError("Unexpected token in JSON at position 4"),
    );
    expect(described).toEqual({
      message: "Unexpected token",
      line: 2,
      column: 3,
    });
  });

  it("falls back to the locator for trailing commas", () => {
    const located = locateJsonSyntaxError('{"a":1,}');
    expect(located).toMatchObject({
      line: 1,
      column: 8,
      detail: "Trailing comma in object.",
    });
  });

  it("locates a missing comma on a later line", () => {
    const input = `{
  "name": "Ada"
  "ok": true
}`;
    const located = locateJsonSyntaxError(input);
    expect(located?.line).toBe(3);
    expect(located?.column).toBe(3);
  });

  it("locates an unterminated string", () => {
    const located = locateJsonSyntaxError('{"a": "nope}');
    expect(located?.detail).toMatch(/unterminated/i);
    expect(located?.line).toBe(1);
  });

  it("returns line and column for representative invalid JSON", () => {
    const cases = [
      '{"a":1,}',
      '{"a":1',
      '{"a": undefined}',
      '{\n  "a": 1,\n}',
    ];

    for (const input of cases) {
      const result = parseJson(input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.line, input).toEqual(expect.any(Number));
        expect(result.column, input).toEqual(expect.any(Number));
      }
    }
  });
});

describe("size guidance", () => {
  it("keeps a single recommended maximum", () => {
    expect(MAX_JSON_INPUT_SIZE).toBe(5 * 1024 * 1024);
    expect(WARN_JSON_INPUT_SIZE).toBe(Math.floor(MAX_JSON_INPUT_SIZE * 0.8));
  });

  it("warns when input approaches or exceeds the limit", () => {
    expect(getJsonInputSizeWarning("small")).toBeNull();
    expect(
      getJsonInputSizeWarning("x".repeat(WARN_JSON_INPUT_SIZE)),
    ).toMatch(/large json/i);
    expect(
      getJsonInputSizeWarning("x".repeat(MAX_JSON_INPUT_SIZE)),
    ).toMatch(/recommended/);
  });

  it("includes a realistic example payload", () => {
    expect(parseJson(JSON_FORMATTER_EXAMPLE).ok).toBe(true);
  });
});
