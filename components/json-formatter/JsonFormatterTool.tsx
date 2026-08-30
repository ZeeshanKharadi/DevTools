"use client";

import {
  useCallback,
  useId,
  useMemo,
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
import { Textarea } from "@/components/ui/Textarea";
import {
  JSON_FORMATTER_EXAMPLE,
  formatJson,
  getJsonInputSizeWarning,
  minifyJson,
  validateJson,
} from "@/lib/tools/json-formatter";
import type { JsonError } from "@/lib/tools/json-formatter";

type Status =
  | { kind: "idle" }
  | { kind: "valid" }
  | { kind: "formatted" }
  | { kind: "minified" }
  | { kind: "error"; error: JsonError };

function shortcutLabel() {
  return "Ctrl+Enter";
}

export default function JsonFormatterTool() {
  const inputId = useId();
  const outputId = useId();
  const errorId = useId();
  const warningId = useId();

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [downloadName, setDownloadName] = useState("formatted.json");

  const sizeWarning = useMemo(() => getJsonInputSizeWarning(input), [input]);
  const error = status.kind === "error" ? status.error : null;
  const hasInput = input.trim().length > 0;

  const updateInput = useCallback((value: string) => {
    setInput(value);
    setStatus({ kind: "idle" });
  }, []);

  const runFormat = useCallback(() => {
    const result = formatJson(input);

    if (!result.ok) {
      setStatus({ kind: "error", error: result });
      return;
    }

    setOutput(result.output);
    setDownloadName("formatted.json");
    setStatus({ kind: "formatted" });
  }, [input]);

  const runMinify = useCallback(() => {
    const result = minifyJson(input);

    if (!result.ok) {
      setStatus({ kind: "error", error: result });
      return;
    }

    setOutput(result.output);
    setDownloadName("minified.json");
    setStatus({ kind: "minified" });
  }, [input]);

  const runValidate = useCallback(() => {
    const result = validateJson(input);

    if (!result.ok) {
      setStatus({ kind: "error", error: result });
      return;
    }

    setStatus({ kind: "valid" });
  }, [input]);

  function handleClear() {
    setInput("");
    setOutput("");
    setStatus({ kind: "idle" });
    setDownloadName("formatted.json");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      runFormat();
    }
  }

  return (
    <ToolWorkspace
      label="JSON Formatter workspace"
      capabilities={["copy", "clear", "paste", "download"]}
      className="space-y-5"
    >
      {sizeWarning ? (
        <Feedback id={warningId} tone="empty" live>
          {sizeWarning}
        </Feedback>
      ) : null}

      <div
        className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-8"
        onKeyDown={handleKeyDown}
      >
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <label
              htmlFor={inputId}
              className="text-sm font-semibold tracking-tight text-foreground"
            >
              Input
            </label>
            <span className="text-xs text-muted">JSON to format</span>
          </div>
          <Textarea
            id={inputId}
            surface="input"
            value={input}
            onChange={(event) => updateInput(event.target.value)}
            placeholder="Paste or type JSON to get started."
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error ? errorId : sizeWarning ? warningId : undefined
            }
            className="min-h-80 lg:min-h-[32rem]"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={runFormat}
                title="Format JSON (Ctrl+Enter or Cmd+Enter)"
                aria-keyshortcuts="Control+Enter Meta+Enter"
              >
                Format
                <kbd className="rounded border border-brand-foreground/30 px-1.5 py-0.5 text-[10px] font-normal text-brand-foreground">
                  {shortcutLabel()}
                </kbd>
              </Button>
              <Button onClick={runMinify}>Minify</Button>
              <Button onClick={runValidate}>Validate</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <PasteButton onPaste={updateInput} variant="ghost" />
              <Button
                variant="ghost"
                onClick={() => updateInput(JSON_FORMATTER_EXAMPLE)}
              >
                Load example
              </Button>
              <ClearButton
                onClear={handleClear}
                disabled={!hasInput && !output}
                variant="ghost"
              />
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <label
              htmlFor={outputId}
              className="text-sm font-semibold tracking-tight text-foreground"
            >
              Output
            </label>
            <span className="text-xs text-muted">Formatted result</span>
          </div>
          <Textarea
            id={outputId}
            surface="output"
            value={output}
            readOnly
            spellCheck={false}
            placeholder="Formatted or minified JSON will appear here."
            className="min-h-80 lg:min-h-[32rem]"
          />
          <div className="flex flex-wrap gap-2">
            <CopyButton value={output} />
            <DownloadButton
              value={output}
              filename={downloadName}
              mimeType="application/json;charset=utf-8"
            />
          </div>
        </div>
      </div>

      {!hasInput && status.kind === "idle" ? (
        <Feedback tone="empty">
          Paste or type JSON to get started. Use Load example for a sample
          object.
        </Feedback>
      ) : null}

      {status.kind === "valid" ? (
        <Feedback tone="success" live>
          Valid JSON.
        </Feedback>
      ) : null}

      {status.kind === "formatted" ? (
        <Feedback tone="success" live>
          Formatted JSON with 2-space indentation.
        </Feedback>
      ) : null}

      {status.kind === "minified" ? (
        <Feedback tone="success" live>
          Minified JSON.
        </Feedback>
      ) : null}

      {error ? (
        <Feedback id={errorId} tone="error" live>
          <span className="block font-semibold">Invalid JSON</span>
          <span className="mt-1 block">{error.message}</span>
          {error.line !== null && error.column !== null ? (
            <span className="mt-1 block">
              Line {error.line}, Column {error.column}
            </span>
          ) : null}
        </Feedback>
      ) : null}
    </ToolWorkspace>
  );
}
