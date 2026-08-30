"use client";

import {
  useCallback,
  useId,
  useState,
  type KeyboardEvent,
} from "react";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Button } from "@/components/ui/Button";
import { ClearButton } from "@/components/ui/ClearButton";
import { CopyButton } from "@/components/ui/CopyButton";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { Feedback } from "@/components/ui/Feedback";
import { PasteButton } from "@/components/ui/PasteButton";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  DEFAULT_SQL_DIALECT,
  SQL_DIALECTS,
  SQL_FORMATTER_EXAMPLE,
  formatSql,
} from "@/lib/tools/sql-formatter";

type Status =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "ok" }
  | { kind: "error"; message: string };

export default function SqlFormatterTool() {
  const inputId = useId();
  const outputId = useId();
  const dialectId = useId();
  const errorId = useId();

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [dialect, setDialect] = useState(DEFAULT_SQL_DIALECT);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const error = status.kind === "error" ? status.message : null;
  const hasContent = input.length > 0 || output.length > 0;

  const updateInput = useCallback((value: string) => {
    setInput(value);
    setStatus({ kind: "idle" });
  }, []);

  const runFormat = useCallback(async () => {
    setStatus({ kind: "running" });
    const result = await formatSql(input, dialect);

    if (!result.ok) {
      setStatus({ kind: "error", message: result.message });
      return;
    }

    setOutput(result.output);
    setStatus({ kind: "ok" });
  }, [dialect, input]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      void runFormat();
    }
  }

  return (
    <ToolWorkspace
      label="SQL Formatter workspace"
      capabilities={["copy", "clear", "paste", "download"]}
      className="space-y-5"
    >
      <p className="text-xs text-muted">
        Uses sql-formatter in your browser. Formatting does not mean the SQL is
        valid or executable. Dialects are only those this library supports.
      </p>

      <div className="max-w-sm space-y-1">
        <label htmlFor={dialectId} className="text-sm font-medium">
          Dialect
        </label>
        <Select
          id={dialectId}
          value={dialect}
          onChange={(event) =>
            setDialect(
              event.target.value as (typeof SQL_DIALECTS)[number]["id"],
            )
          }
        >
          {SQL_DIALECTS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div
        className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-8"
        onKeyDown={handleKeyDown}
      >
        <div className="flex min-w-0 flex-col gap-3">
          <label htmlFor={inputId} className="text-sm font-semibold">
            Input
          </label>
          <Textarea
            id={inputId}
            surface="input"
            value={input}
            onChange={(event) => updateInput(event.target.value)}
            placeholder="Paste SQL to format."
            spellCheck={false}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="min-h-80 lg:min-h-[32rem]"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() => void runFormat()}
                disabled={status.kind === "running"}
                title="Format SQL (Ctrl+Enter or Cmd+Enter)"
                aria-keyshortcuts="Control+Enter Meta+Enter"
              >
                {status.kind === "running" ? "Formatting…" : "Format"}
                <kbd className="rounded border border-brand-foreground/30 px-1.5 py-0.5 text-[10px] font-normal text-brand-foreground">
                  Ctrl+Enter
                </kbd>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <PasteButton onPaste={updateInput} variant="ghost" />
              <Button
                variant="ghost"
                onClick={() => updateInput(SQL_FORMATTER_EXAMPLE)}
              >
                Load example
              </Button>
              <ClearButton
                onClear={() => {
                  setInput("");
                  setOutput("");
                  setStatus({ kind: "idle" });
                }}
                disabled={!hasContent}
                variant="ghost"
              />
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <label htmlFor={outputId} className="text-sm font-semibold">
            Output
          </label>
          <Textarea
            id={outputId}
            surface="output"
            value={output}
            readOnly
            spellCheck={false}
            placeholder="Formatted SQL will appear here."
            className="min-h-80 lg:min-h-[32rem]"
          />
          <div className="flex flex-wrap gap-2">
            <CopyButton value={output} />
            <DownloadButton
              value={output}
              filename="formatted.sql"
              mimeType="text/sql;charset=utf-8"
            />
          </div>
        </div>
      </div>

      {status.kind === "ok" ? (
        <Feedback tone="success" live>
          Formatted with the {dialect} dialect. This is not a guarantee that the
          query can run.
        </Feedback>
      ) : null}

      {error ? (
        <Feedback id={errorId} tone="error" live>
          {error}
        </Feedback>
      ) : null}
    </ToolWorkspace>
  );
}
