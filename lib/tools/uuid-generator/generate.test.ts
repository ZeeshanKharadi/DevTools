import { describe, expect, it } from "vitest";
import {
  MAX_UUID_COUNT,
  MIN_UUID_COUNT,
  UUID_V4_PATTERN,
  generateUuids,
  parseUuidCount,
} from "./index";

describe("parseUuidCount", () => {
  it("accepts the configured range", () => {
    expect(parseUuidCount(1).ok).toBe(true);
    expect(parseUuidCount(MAX_UUID_COUNT).ok).toBe(true);
  });

  it("rejects invalid and excessive counts", () => {
    expect(parseUuidCount(0).ok).toBe(false);
    expect(parseUuidCount(MAX_UUID_COUNT + 1).ok).toBe(false);
    expect(parseUuidCount(1.5).ok).toBe(false);
    expect(parseUuidCount("abc").ok).toBe(false);
  });
});

describe("generateUuids", () => {
  it("generates one UUID v4", () => {
    const result = generateUuids(1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.uuids).toHaveLength(1);
      expect(result.uuids[0]).toMatch(UUID_V4_PATTERN);
    }
  });

  it("generates the requested number of unique UUID v4 values", () => {
    const result = generateUuids(10);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.uuids).toHaveLength(10);
      expect(new Set(result.uuids).size).toBe(10);
      expect(result.uuids.every((value) => UUID_V4_PATTERN.test(value))).toBe(
        true,
      );
    }
  });

  it("uses the configured maximum", () => {
    expect(MIN_UUID_COUNT).toBe(1);
    expect(MAX_UUID_COUNT).toBe(100);
    expect(generateUuids(MAX_UUID_COUNT).ok).toBe(true);
    expect(generateUuids(MAX_UUID_COUNT + 1).ok).toBe(false);
  });
});
