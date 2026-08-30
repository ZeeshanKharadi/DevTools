import { describe, expect, it } from "vitest";
import { URL_ENCODER_EXAMPLE, decodeUrl, encodeUrl } from "./index";

describe("encodeUrl / decodeUrl", () => {
  it("encodes spaces, ampersands, and unicode", () => {
    expect(encodeUrl("hello world")).toEqual({
      ok: true,
      output: "hello%20world",
    });
    expect(encodeUrl("café")).toEqual({
      ok: true,
      output: "caf%C3%A9",
    });
    expect(encodeUrl("a&b")).toEqual({
      ok: true,
      output: "a%26b",
    });
  });

  it("round-trips the example", () => {
    const encoded = encodeUrl(URL_ENCODER_EXAMPLE);
    expect(encoded.ok).toBe(true);
    if (encoded.ok) {
      expect(decodeUrl(encoded.output)).toEqual({
        ok: true,
        output: URL_ENCODER_EXAMPLE,
      });
    }
  });

  it("rejects empty input and malformed sequences", () => {
    expect(encodeUrl("").ok).toBe(false);
    expect(decodeUrl("").ok).toBe(false);
    expect(decodeUrl("%E0%A4%A")).toMatchObject({ ok: false });
  });
});
