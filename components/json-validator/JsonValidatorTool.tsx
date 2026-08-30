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
import { Feedback } from "@/components/ui/Feedback";
import { PasteButton } from "@/components/ui/PasteButton";
import { Textarea } from "@/components/ui/Textarea";
import {
  JSON_VALIDATOR_EXAMPLE,
  getJsonInputSizeWarning,
  validateJson,
  type JsonError,
} from "@/lib/tools/json-validator";

type Status =
  | { kind: "idle" }
  | { kind: "valid" }
  | { kind: "error"; error: JsonError };

export default function JsonValidatorTool() {
  const inputId = useId();
  const errorId = useId();
  const warningId = useId();

  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const sizeWarning = useMemo(() => getJsonInputSizeWarning(input), [input]);
  const error = status.kind === "error" ? status.error : null;
  const hasInput = input.trim().length > 0;

  const updateInput = useCallback((value: string) => {
    setInput(value);
    setStatus({ kind: "idle" });
  }, []);

  const runValidate = useCallback(() => {
    const result = validateJson(input);

    if (!result.ok) {
      setStatus({ kind: "error", error: result });
      return;
    }

    setStatus({ kind: "valid" });
  }, [input]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      runValidate();
    }
  }

  return (
    <ToolWorkspace
      label="JSON Validator workspace"
      capabilities={["copy", "clear"]}
      className="space-y-5"
    >
      {sizeWarning ? (
        <Feedback id={warningId} tone="empty" live>
          {sizeWarning}
        </Feedback>
      ) : null}

      <div className="flex min-w-0 flex-col gap-3" onKeyDown={handleKeyDown}>
        <div className="flex items-baseline justify-between gap-3">
          <label
            htmlFor={inputId}
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            JSON
          </label>
          <span className="text-xs text-muted">Syntax check only</span>
        </div>
        <Textarea
          id={inputId}
          surface="input"
          value={input}
          onChange={(event) => updateInput(event.target.value)}
          placeholder="Paste or type JSON to validate."
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
              onClick={runValidate}
              title="Validate JSON (Ctrl+Enter or Cmd+Enter)"
              aria-keyshortcuts="Control+Enter Meta+Enter"
            >
              Validate
              <kbd className="rounded border border-brand-foreground/30 px-1.5 py-0.5 text-[10px] font-normal text-brand-foreground">
                Ctrl+Enter
              </kbd>
            </Button>
            <CopyButton value={input} />
          </div>
          <div className="flex flex-wrap gap-2">
            <PasteButton onPaste={updateInput} variant="ghost" />
            <Button
              variant="ghost"
              onClick={() => updateInput(JSON_VALIDATOR_EXAMPLE)}
            >
              Load example
            </Button>
            <ClearButton
              onClear={() => {
                setInput("");
                setStatus({ kind: "idle" });
              }}
              disabled={!hasInput}
              variant="ghost"
            />
          </div>
        </div>
      </div>

      {!hasInput && status.kind === "idle" ? (
        <Feedback tone="empty">
          Paste or type JSON to get started. Validation does not change your
          input.
        </Feedback>
      ) : null}

      {status.kind === "valid" ? (
        <Feedback tone="success" live>
          Valid JSON.
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
