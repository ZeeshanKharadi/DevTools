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
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  MAX_DISPLAYED_MATCHES,
  REGEX_FLAGS,
  REGEX_FLAG_LABELS,
  REGEX_MATCH_TIMEOUT_MS,
  REGEX_TESTER_EXAMPLE,
  isRegexFlag,
  runRegexTest,
  type RegexFlag,
  type RegexSuccess,
} from "@/lib/tools/regex-tester";

type Status =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "ok"; result: RegexSuccess }
  | { kind: "error"; message: string };

export default function RegexTesterTool() {
  const patternId = useId();
  const textId = useId();
  const errorId = useId();
  const flagsName = useId();

  const [pattern, setPattern] = useState("");
  const [text, setText] = useState("");
  const [flags, setFlags] = useState<RegexFlag[]>(["g"]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const flagString = flags.join("");
  const error = status.kind === "error" ? status.message : null;

  const toggleFlag = useCallback((flag: RegexFlag) => {
    setFlags((current) =>
      current.includes(flag)
        ? current.filter((item) => item !== flag)
        : [...current, flag],
    );
    setStatus({ kind: "idle" });
  }, []);

  const runTest = useCallback(async () => {
    setStatus({ kind: "running" });
    const result = await runRegexTest({
      pattern,
      flags: flagString,
      text,
    });

    if (!result.ok) {
      setStatus({ kind: "error", message: result.message });
      return;
    }

    setStatus({ kind: "ok", result });
  }, [flagString, pattern, text]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      void runTest();
    }
  }

  function handleClear() {
    setPattern("");
    setText("");
    setFlags(["g"]);
    setStatus({ kind: "idle" });
  }

  const copyText =
    status.kind === "ok"
      ? status.result.matches
          .map((item, index) => `${index + 1}. ${item.value} @ ${item.index}`)
          .join("\n")
      : "";

  return (
    <ToolWorkspace
      label="Regex Tester workspace"
      capabilities={["copy", "clear"]}
      className="space-y-5"
    >
      <p className="text-xs text-muted">
        JavaScript RegExp in a Web Worker. Matching stops after{" "}
        {REGEX_MATCH_TIMEOUT_MS} ms or {MAX_DISPLAYED_MATCHES} displayed
        matches.
      </p>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2" onKeyDown={handleKeyDown}>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="space-y-1">
            <label htmlFor={patternId} className="text-sm font-semibold">
              Pattern
            </label>
            <Input
              id={patternId}
              value={pattern}
              onChange={(event) => {
                setPattern(event.target.value);
                setStatus({ kind: "idle" });
              }}
              placeholder="(\\d{4})-(\\d{2})-(\\d{2})"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className="font-mono"
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Flags</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {REGEX_FLAGS.map((flag) => (
                <label
                  key={flag}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <input
                    type="checkbox"
                    name={flagsName}
                    checked={flags.includes(flag)}
                    onChange={() => toggleFlag(flag)}
                  />
                  <span className="font-mono">{flag}</span>
                  <span className="text-muted">{REGEX_FLAG_LABELS[flag]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-1">
            <label htmlFor={textId} className="text-sm font-semibold">
              Test text
            </label>
            <Textarea
              id={textId}
              surface="input"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setStatus({ kind: "idle" });
              }}
              placeholder="Text to search."
              spellCheck={false}
              className="min-h-48 lg:min-h-64"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() => void runTest()}
                disabled={status.kind === "running"}
                title="Test regex (Ctrl+Enter or Cmd+Enter)"
                aria-keyshortcuts="Control+Enter Meta+Enter"
              >
                {status.kind === "running" ? "Testing…" : "Test"}
                <kbd className="rounded border border-brand-foreground/30 px-1.5 py-0.5 text-[10px] font-normal text-brand-foreground">
                  Ctrl+Enter
                </kbd>
              </Button>
              <CopyButton value={copyText} label="Copy matches" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setPattern(REGEX_TESTER_EXAMPLE.pattern);
                  setText(REGEX_TESTER_EXAMPLE.text);
                  setFlags(
                    REGEX_TESTER_EXAMPLE.flags.split("").filter(isRegexFlag),
                  );
                  setStatus({ kind: "idle" });
                }}
              >
                Load example
              </Button>
              <ClearButton
                onClear={handleClear}
                disabled={!pattern && !text && status.kind === "idle"}
                variant="ghost"
              />
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-3">
          <h3 className="text-sm font-semibold">Matches</h3>

          {status.kind === "idle" ? (
            <Feedback tone="empty">
              Enter a pattern and test text, then choose Test.
            </Feedback>
          ) : null}

          {status.kind === "running" ? (
            <Feedback live>Matching in a Web Worker…</Feedback>
          ) : null}

          {status.kind === "ok" && status.result.matches.length === 0 ? (
            <Feedback tone="empty" live>
              No matches.
            </Feedback>
          ) : null}

          {status.kind === "ok" && status.result.matches.length > 0 ? (
            <div className="space-y-3">
              <Feedback tone="success" live>
                {status.result.truncated
                  ? `Showing ${status.result.matches.length} of at least ${status.result.totalFound} matches (display limit ${MAX_DISPLAYED_MATCHES}).`
                  : `${status.result.matches.length} match${status.result.matches.length === 1 ? "" : "es"}.`}
              </Feedback>
              <ol className="space-y-2">
                {status.result.matches.map((match, index) => (
                  <li
                    key={`${match.index}-${index}`}
                    className="rounded-lg border border-line bg-editor-alt px-3 py-2 text-sm"
                  >
                    <p className="font-mono break-all">{match.value}</p>
                    <p className="mt-1 text-xs text-muted">
                      Index {match.index}–{match.end}
                    </p>
                    {match.captures.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-xs">
                        {match.captures.map((capture, captureIndex) => (
                          <li key={`${capture.value}-${captureIndex}`}>
                            Group {captureIndex + 1}
                            {capture.name ? ` (${capture.name})` : ""}:{" "}
                            <span className="font-mono">{capture.value}</span>
                            {capture.start !== null && capture.end !== null
                              ? ` @ ${capture.start}–${capture.end}`
                              : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {error ? (
            <Feedback id={errorId} tone="error" live>
              {error}
            </Feedback>
          ) : null}
        </div>
      </div>
    </ToolWorkspace>
  );
}
