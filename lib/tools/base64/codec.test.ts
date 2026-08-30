import { describe, expect, it } from "vitest";
import { BASE64_EXAMPLE, decodeBase64, encodeBase64 } from "./index";

describe("encodeBase64 / decodeBase64", () => {
  it("encodes and decodes unicode text", () => {
    const encoded = encodeBase64(BASE64_EXAMPLE);
    expect(encoded.ok).toBe(true);
    if (encoded.ok) {
      const decoded = decodeBase64(encoded.output);
      expect(decoded).toEqual({ ok: true, output: BASE64_EXAMPLE });
    }
  });

  it("encodes a known ASCII string", () => {
    expect(encodeBase64("hello")).toEqual({
      ok: true,
      output: "aGVsbG8=",
    });
  });

  it("decodes Base64 that includes whitespace", () => {
    expect(decodeBase64("aGVs\nbG8=")).toEqual({
      ok: true,
      output: "hello",
    });
  });

  it("rejects empty input and invalid Base64", () => {
    expect(encodeBase64("").ok).toBe(false);
    expect(decodeBase64("").ok).toBe(false);
    expect(decodeBase64("%%%").ok).toBe(false);
  });
});
