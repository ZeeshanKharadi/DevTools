import type { SqlLanguage } from "sql-formatter";
import { DEFAULT_SQL_DIALECT, SQL_DIALECTS } from "./dialects";

export type SqlFormatResult =
  | { ok: true; output: string }
  | { ok: false; message: string };

function isSupportedDialect(value: string): value is SqlLanguage {
  return SQL_DIALECTS.some((dialect) => dialect.id === value);
}

export async function formatSql(
  input: string,
  dialect: string = DEFAULT_SQL_DIALECT,
): Promise<SqlFormatResult> {
  if (input.trim().length === 0) {
    return { ok: false, message: "Enter SQL to format." };
  }

  if (!isSupportedDialect(dialect)) {
    return {
      ok: false,
      message: "Choose a dialect that sql-formatter supports.",
    };
  }

  try {
    const { format, supportedDialects } = await import("sql-formatter");

    if (!supportedDialects.includes(dialect) && dialect !== "tsql") {
      return {
        ok: false,
        message: `The installed sql-formatter package does not list “${dialect}”.`,
      };
    }

    return {
      ok: true,
      output: format(input, { language: dialect, tabWidth: 2 }),
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The SQL could not be formatted.";

    return {
      ok: false,
      message: `${message} Formatting is not the same as validating that the query can run.`,
    };
  }
}
