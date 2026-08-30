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
import { Feedback } from "@/components/ui/Feedback";
import { PasteButton } from "@/components/ui/PasteButton";
import { Textarea } from "@/components/ui/Textarea";
import {
  BASE64_EXAMPLE,
  decodeBase64,
  encodeBase64,
} from "@/lib/tools/base64";

type Status = { kind: "idle" } | { kind: "ok"; action: "encode" | "decode" } | { kind: "error"; message: string };

export default function Base64Tool() {
  const inputId = useId();
  const outputId = useId();
  const errorId = useId();

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const error = status.kind === "error" ? status.message : null;
  const hasContent = input.length > 0 || output.length > 0;

  const updateInput = useCallback((value: string) => {
    setInput(value);
    setStatus({ kind: "idle" });
  }, []);

  const runEncode = useCallback(() => {
    const result = encodeBase64(input);

    if (!result.ok) {
      setStatus({ kind: "error", message: result.message });
      return;
    }

    setOutput(result.output);
    setStatus({ kind: "ok", action: "encode" });
  }, [input]);

  const runDecode = useCallback(() => {
    const result = decodeBase64(input);

    if (!result.ok) {
      setStatus({ kind: "error", message: result.message });
      return;
    }

    setOutput(result.output);
    setStatus({ kind: "ok", action: "decode" });
  }, [input]);

  function handleSwap() {
    setInput(output);
    setOutput(input);
    setStatus({ kind: "idle" });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      runEncode();
    }
  }

  return (
    <ToolWorkspace
      label="Base64 workspace"
      capabilities={["copy", "clear", "swap"]}
      className="space-y-5"
    >
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
            <span className="text-xs text-muted">Text or Base64</span>
          </div>
          <Textarea
            id={inputId}
            surface="input"
            value={input}
            onChange={(event) => updateInput(event.target.value)}
            placeholder="Paste text to encode, or Base64 to decode."
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="min-h-80 lg:min-h-[32rem]"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={runEncode}
                title="Encode to Base64 (Ctrl+Enter or Cmd+Enter)"
                aria-keyshortcuts="Control+Enter Meta+Enter"
              >
                Encode
                <kbd className="rounded border border-brand-foreground/30 px-1.5 py-0.5 text-[10px] font-normal text-brand-foreground">
                  Ctrl+Enter
                </kbd>
              </Button>
              <Button onClick={runDecode}>Decode</Button>
              <Button onClick={handleSwap} disabled={!hasContent}>
                Swap
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <PasteButton onPaste={updateInput} variant="ghost" />
              <Button
                variant="ghost"
                onClick={() => updateInput(BASE64_EXAMPLE)}
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
          <div className="flex items-baseline justify-between gap-3">
            <label
              htmlFor={outputId}
              className="text-sm font-semibold tracking-tight text-foreground"
            >
              Output
            </label>
            <span className="text-xs text-muted">Result</span>
          </div>
          <Textarea
            id={outputId}
            surface="output"
            value={output}
            readOnly
            spellCheck={false}
            placeholder="Encoded or decoded text will appear here."
            className="min-h-80 lg:min-h-[32rem]"
          />
          <div className="flex flex-wrap gap-2">
            <CopyButton value={output} />
          </div>
        </div>
      </div>

      {!hasContent && status.kind === "idle" ? (
        <Feedback tone="empty">
          Enter text to encode or Base64 to decode. Unicode is supported.
        </Feedback>
      ) : null}

      {status.kind === "ok" ? (
        <Feedback tone="success" live>
          {status.action === "encode"
            ? "Encoded to Base64."
            : "Decoded from Base64."}
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
