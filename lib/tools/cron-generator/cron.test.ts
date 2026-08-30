import { describe, expect, it } from "vitest";
import {
  CRON_EXAMPLES,
  explainCron,
  generateCron,
} from "./index";

describe("generateCron", () => {
  it("generates every minute", () => {
    expect(generateCron({ kind: "every-minute" })).toEqual({
      ok: true,
      expression: "* * * * *",
      explanation: "Runs every minute.",
    });
  });

  it("generates every N minutes", () => {
    expect(generateCron({ kind: "every-n-minutes", n: 5 })).toEqual({
      ok: true,
      expression: "*/5 * * * *",
      explanation: "Runs every 5 minutes.",
    });
  });

  it("treats every 1 minute as every minute", () => {
    expect(generateCron({ kind: "every-n-minutes", n: 1 })).toEqual({
      ok: true,
      expression: "* * * * *",
      explanation: "Runs every minute.",
    });
  });

  it("generates hourly", () => {
    expect(generateCron({ kind: "hourly" })).toEqual({
      ok: true,
      expression: "0 * * * *",
      explanation: "Runs at the start of every hour.",
    });
  });

  it("generates daily at a selected time", () => {
    expect(generateCron({ kind: "daily", hour: 9, minute: 0 })).toEqual({
      ok: true,
      expression: "0 9 * * *",
      explanation: "Runs at 9:00 AM every day.",
    });
  });

  it("generates weekly at a selected weekday and time", () => {
    expect(
      generateCron({ kind: "weekly", hour: 9, minute: 0, weekday: 1 }),
    ).toEqual({
      ok: true,
      expression: "0 9 * * 1",
      explanation: "Runs at 9:00 AM every Monday.",
    });
  });

  it("generates weekdays at a selected time", () => {
    expect(generateCron({ kind: "weekdays", hour: 9, minute: 0 })).toEqual({
      ok: true,
      expression: "0 9 * * 1-5",
      explanation: "Runs at 9:00 AM every Monday through Friday.",
    });
  });

  it("rejects invalid configuration", () => {
    expect(generateCron({ kind: "every-n-minutes", n: 0 }).ok).toBe(false);
    expect(generateCron({ kind: "every-n-minutes", n: 60 }).ok).toBe(false);
    expect(generateCron({ kind: "daily", hour: 24, minute: 0 }).ok).toBe(false);
    expect(
      generateCron({ kind: "weekly", hour: 9, minute: 0, weekday: 7 as never })
        .ok,
    ).toBe(false);
  });
});

describe("explainCron", () => {
  it("explains every generated example", () => {
    for (const example of CRON_EXAMPLES) {
      const generated = generateCron(example.preset);
      expect(generated.ok).toBe(true);
      if (generated.ok) {
        expect(generated.expression).toBe(example.expression);
        expect(explainCron(example.expression)).toEqual(generated);
      }
    }
  });

  it("refuses cron syntax outside the supported subset", () => {
    expect(explainCron("0 0 1 * *").ok).toBe(false);
    expect(explainCron("* * * * * *").ok).toBe(false);
  });
});
