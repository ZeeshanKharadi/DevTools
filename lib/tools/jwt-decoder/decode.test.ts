import { describe, expect, it } from "vitest";
import {
  JWT_DECODER_EXAMPLE,
  decodeJwt,
  encodeBase64Url,
  formatJwtTime,
} from "./index";

function token(header: unknown, payload: unknown, signature = "") {
  return [
    encodeBase64Url(JSON.stringify(header)),
    encodeBase64Url(JSON.stringify(payload)),
    signature,
  ].join(".");
}

describe("decodeJwt", () => {
  it("decodes header and payload without verifying a signature", () => {
    const result = decodeJwt(JWT_DECODER_EXAMPLE);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.header).toEqual({ alg: "none", typ: "JWT" });
      expect(result.payload).toMatchObject({
        sub: "user-1001",
        name: "Ada Lovelace",
      });
      expect(result.signaturePresent).toBe(false);
      expect(result.headerText).toContain('"alg": "none"');
    }
  });

  it("strips a Bearer prefix", () => {
    const result = decodeJwt(`Bearer ${JWT_DECODER_EXAMPLE}`);
    expect(result.ok).toBe(true);
  });

  it("reads exp and iat as human-readable times", () => {
    const result = decodeJwt(
      token({ alg: "none" }, { iat: 1516239022, exp: 1916239022 }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.times.map((item) => item.claim)).toEqual(["exp", "iat"]);
      expect(result.times[0]?.utc).toContain("GMT");
      expect(result.times[0]?.local.length).toBeGreaterThan(0);
    }
  });

  it("notes when a signature segment is present but does not verify it", () => {
    const result = decodeJwt(token({ alg: "HS256" }, { sub: "1" }, "abc"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.signaturePresent).toBe(true);
    }
  });

  it("rejects empty input and malformed tokens", () => {
    expect(decodeJwt("").ok).toBe(false);
    expect(decodeJwt("only-one-part").ok).toBe(false);
    expect(decodeJwt("a.b.c.d").ok).toBe(false);
    expect(decodeJwt("@@@.@@@").ok).toBe(false);
  });

  it("rejects a payload that is not JSON", () => {
    const result = decodeJwt(
      `${encodeBase64Url('{"alg":"none"}')}.${encodeBase64Url("not-json")}.`,
    );
    expect(result).toMatchObject({
      ok: false,
      message: "The payload is not valid JSON.",
    });
  });
});

describe("formatJwtTime", () => {
  it("formats unix seconds", () => {
    const formatted = formatJwtTime(1516239022);
    expect(formatted?.unix).toBe(1516239022);
    expect(formatted?.utc).toContain("2018");
  });

  it("returns null for non-numeric values", () => {
    expect(formatJwtTime("1516239022")).toBeNull();
    expect(formatJwtTime(Number.NaN)).toBeNull();
  });
});
