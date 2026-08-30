import { describe, expect, it, vi } from "vitest";
import {
  MAX_DISPLAYED_MATCHES,
  compileRegex,
  findMatches,
  parseFlags,
  runRegexTest,
  testRegex,
} from "./index";

describe("parseFlags / compileRegex", () => {
  it("accepts standard JavaScript flags", () => {
    expect(parseFlags("gim")).toEqual({ ok: true, flags: "gim" });
    const compiled = compileRegex("foo", "i");
    expect(compiled.ok).toBe(true);
    if (compiled.ok) {
      expect(compiled.regex.flags).toContain("i");
      expect(compiled.regex.flags).toContain("d");
    }
  });

  it("rejects unknown, duplicate, and conflicting flags", () => {
    expect(parseFlags("z").ok).toBe(false);
    expect(parseFlags("ii").ok).toBe(false);
    expect(parseFlags("uv").ok).toBe(false);
  });

  it("rejects an empty or invalid pattern without throwing", () => {
    expect(compileRegex("", "")).toMatchObject({
      ok: false,
      message: "Enter a regular expression pattern.",
    });
    expect(compileRegex("(", "")).toMatchObject({ ok: false });
  });
});

describe("findMatches / testRegex", () => {
  it("returns match indexes and capture groups", () => {
    const result = testRegex({
      pattern: "(\\d{4})-(\\d{2})-(\\d{2})",
      flags: "g",
      text: "2024-01-15 and 1999-12-31",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matches).toHaveLength(2);
      expect(result.matches[0]).toMatchObject({
        value: "2024-01-15",
        index: 0,
        end: 10,
      });
      expect(result.matches[0]?.captures.map((item) => item.value)).toEqual([
        "2024",
        "01",
        "15",
      ]);
      expect(result.matches[0]?.captures[0]).toMatchObject({
        value: "2024",
        start: 0,
        end: 4,
      });
    }
  });

  it("returns no matches for a valid pattern that does not match", () => {
    const result = testRegex({
      pattern: "zzz",
      flags: "",
      text: "hello",
    });
    expect(result).toEqual({
      ok: true,
      matches: [],
      truncated: false,
      totalFound: 0,
    });
  });

  it("stops at the configured display maximum", () => {
    const text = Array.from({ length: MAX_DISPLAYED_MATCHES + 25 }, (_, i) => `a${i}`).join(" ");
    const compiled = compileRegex("a\\d+", "g");
    expect(compiled.ok).toBe(true);
    if (compiled.ok) {
      const result = findMatches(compiled.regex, text, 10);
      expect(result.matches).toHaveLength(10);
      expect(result.truncated).toBe(true);
      expect(result.totalFound).toBeGreaterThan(10);
    }
  });
});

describe("runRegexTest worker timeout", () => {
  it("terminates the worker when the timeout is exceeded", async () => {
    vi.useFakeTimers();

    let terminated = false;
    const worker = {
      postMessage() {},
      terminate() {
        terminated = true;
      },
      onmessage: null,
      onerror: null,
    };

    const pending = runRegexTest(
      { pattern: "a+", flags: "", text: "a" },
      {
        timeoutMs: 40,
        createWorker: () => worker as unknown as Worker,
      },
    );

    vi.advanceTimersByTime(40);
    const result = await pending;

    expect(terminated).toBe(true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/250|40|timed out|stopped/i);
    }

    vi.useRealTimers();
  });

  it("returns worker results and terminates on success", async () => {
    const worker = {
      terminate: vi.fn(),
      onmessage: null as ((event: MessageEvent) => void) | null,
      onerror: null,
      postMessage(data: { id: number }) {
        this.onmessage?.({
          data: {
            id: data.id,
            result: {
              ok: true,
              matches: [],
              truncated: false,
              totalFound: 0,
            },
          },
        } as MessageEvent);
      },
    };

    const result = await runRegexTest(
      { pattern: "a", flags: "", text: "" },
      { createWorker: () => worker as unknown as Worker },
    );

    expect(result).toEqual({
      ok: true,
      matches: [],
      truncated: false,
      totalFound: 0,
    });
    expect(worker.terminate).toHaveBeenCalled();
  });
});
