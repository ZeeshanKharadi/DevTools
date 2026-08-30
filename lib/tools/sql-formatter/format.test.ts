import { describe, expect, it } from "vitest";
import { format as packageFormat, supportedDialects } from "sql-formatter";
import {
  DEFAULT_SQL_DIALECT,
  SQL_DIALECTS,
  SQL_FORMATTER_EXAMPLE,
  formatSql,
} from "./index";

describe("SQL dialects", () => {
  it("only offers dialects from sql-formatter", () => {
    const known = new Set(supportedDialects);

    for (const dialect of SQL_DIALECTS) {
      expect(
        known.has(dialect.id) || dialect.id === "tsql",
        dialect.id,
      ).toBe(true);
    }

    expect(DEFAULT_SQL_DIALECT).toBe("sql");
  });
});

describe("formatSql", () => {
  it("formats a compact select", async () => {
    const result = await formatSql("select id,name from users where active=1;");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toMatch(/select/i);
      expect(result.output).toMatch(/from/i);
      expect(result.output).toContain("\n");
      expect(result.output).toMatch(/users/i);
    }
  });

  it("formats the example with the default dialect", async () => {
    const result = await formatSql(SQL_FORMATTER_EXAMPLE);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toBe(
        packageFormat(SQL_FORMATTER_EXAMPLE, {
          language: "sql",
          tabWidth: 2,
        }),
      );
    }
  });

  it("rejects empty input and unknown dialects", async () => {
    expect(await formatSql("")).toMatchObject({ ok: false });
    expect(await formatSql("select 1", "not-a-dialect")).toMatchObject({
      ok: false,
    });
  });
});
