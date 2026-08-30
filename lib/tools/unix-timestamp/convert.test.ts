import { describe, expect, it } from "vitest";
import {
  currentUnix,
  fromUnix,
  fromUnixInput,
  fromUtcParts,
  parseUnixInput,
} from "./index";

describe("fromUnix", () => {
  it("converts seconds at the Unix epoch", () => {
    const result = fromUnix(0, "seconds");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.iso).toBe("1970-01-01T00:00:00.000Z");
      expect(result.utc).toBe("1970-01-01 00:00:00 UTC");
      expect(result.seconds).toBe(0);
      expect(result.milliseconds).toBe(0);
    }
  });

  it("converts milliseconds at the Unix epoch", () => {
    const result = fromUnix(0, "milliseconds");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.iso).toBe("1970-01-01T00:00:00.000Z");
    }
  });

  it("converts a known seconds timestamp to UTC", () => {
    const result = fromUnix(1_516_239_022, "seconds");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.iso).toBe("2018-01-18T01:30:22.000Z");
      expect(result.utc).toBe("2018-01-18 01:30:22 UTC");
    }
  });

  it("converts a known milliseconds timestamp to UTC", () => {
    const result = fromUnix(1_516_239_022_000, "milliseconds");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.iso).toBe("2018-01-18T01:30:22.000Z");
    }
  });

  it("supports a negative timestamp before the epoch", () => {
    const result = fromUnix(-1, "seconds");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.iso).toBe("1969-12-31T23:59:59.000Z");
      expect(result.utc).toBe("1969-12-31 23:59:59 UTC");
    }
  });
});

describe("fromUtcParts", () => {
  it("converts the epoch to seconds and milliseconds", () => {
    const result = fromUtcParts(1970, 1, 1, 0, 0, 0);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.seconds).toBe(0);
      expect(result.milliseconds).toBe(0);
      expect(result.iso).toBe("1970-01-01T00:00:00.000Z");
    }
  });

  it("converts a UTC date after the epoch", () => {
    const result = fromUtcParts(2018, 1, 18, 1, 30, 22);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.seconds).toBe(1_516_239_022);
      expect(result.milliseconds).toBe(1_516_239_022_000);
    }
  });
});

describe("parseUnixInput / fromUnixInput", () => {
  it("rejects empty and non-integer input", () => {
    expect(parseUnixInput("").ok).toBe(false);
    expect(parseUnixInput("12.5").ok).toBe(false);
    expect(parseUnixInput("now").ok).toBe(false);
  });

  it("does not infer the unit from digit length", () => {
    const asSeconds = fromUnixInput("1516239022", "seconds");
    const asMillis = fromUnixInput("1516239022", "milliseconds");
    expect(asSeconds.ok && asSeconds.iso).toBe("2018-01-18T01:30:22.000Z");
    expect(asMillis.ok && asMillis.iso).toBe("1970-01-18T13:10:39.022Z");
  });
});

describe("currentUnix", () => {
  it("splits a known now value into seconds and milliseconds", () => {
    expect(currentUnix(1_516_239_022_500)).toEqual({
      milliseconds: 1_516_239_022_500,
      seconds: 1_516_239_022,
    });
  });
});
