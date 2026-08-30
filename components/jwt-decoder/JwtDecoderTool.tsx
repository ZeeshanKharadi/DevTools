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
  JWT_DECODER_EXAMPLE,
  decodeJwt,
  type JwtDecodeSuccess,
} from "@/lib/tools/jwt-decoder";

type Status =
  | { kind: "idle" }
  | { kind: "decoded"; result: JwtDecodeSuccess }
  | { kind: "error"; message: string };

export default function JwtDecoderTool() {
  const inputId = useId();
  const headerId = useId();
  const payloadId = useId();
  const errorId = useId();

  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const decoded = status.kind === "decoded" ? status.result : null;
  const error = status.kind === "error" ? status.message : null;
  const hasInput = input.trim().length > 0;

  const updateInput = useCallback((value: string) => {
    setInput(value);
    setStatus({ kind: "idle" });
  }, []);

  const runDecode = useCallback(() => {
    const result = decodeJwt(input);

    if (!result.ok) {
      setStatus({ kind: "error", message: result.message });
      return;
    }

    setStatus({ kind: "decoded", result });
  }, [input]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      runDecode();
    }
  }

  return (
    <ToolWorkspace
      label="JWT Decoder workspace"
      capabilities={["copy", "clear", "paste"]}
      className="space-y-5"
    >
      <Feedback>
        <span className="block font-semibold text-foreground">
          Decode is not verification
        </span>
        <span className="mt-1 block">
          This tool only reads the header and payload. It does not verify the
          JWT signature. Do not treat a decoded token as authenticated.
        </span>
      </Feedback>

      <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-8" onKeyDown={handleKeyDown}>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <label
              htmlFor={inputId}
              className="text-sm font-semibold tracking-tight text-foreground"
            >
              Token
            </label>
            <span className="text-xs text-muted">Header.payload.signature</span>
          </div>
          <Textarea
            id={inputId}
            surface="input"
            value={input}
            onChange={(event) => updateInput(event.target.value)}
            placeholder="Paste a JWT to decode."
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="min-h-64 lg:min-h-[22rem]"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={runDecode}
                title="Decode JWT (Ctrl+Enter or Cmd+Enter)"
                aria-keyshortcuts="Control+Enter Meta+Enter"
              >
                Decode
                <kbd className="rounded border border-brand-foreground/30 px-1.5 py-0.5 text-[10px] font-normal text-brand-foreground">
                  Ctrl+Enter
                </kbd>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <PasteButton onPaste={updateInput} variant="ghost" />
              <Button
                variant="ghost"
                onClick={() => updateInput(JWT_DECODER_EXAMPLE)}
              >
                Load example
              </Button>
              <ClearButton
                onClear={() => {
                  setInput("");
                  setStatus({ kind: "idle" });
                }}
                disabled={!hasInput && !decoded}
                variant="ghost"
              />
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <label
                htmlFor={headerId}
                className="text-sm font-semibold tracking-tight text-foreground"
              >
                Header
              </label>
              <CopyButton value={decoded?.headerText ?? ""} label="Copy header" />
            </div>
            <Textarea
              id={headerId}
              surface="output"
              value={decoded?.headerText ?? ""}
              readOnly
              spellCheck={false}
              placeholder="Decoded header will appear here."
              className="min-h-36 lg:min-h-44"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <label
                htmlFor={payloadId}
                className="text-sm font-semibold tracking-tight text-foreground"
              >
                Payload
              </label>
              <CopyButton value={decoded?.payloadText ?? ""} label="Copy payload" />
            </div>
            <Textarea
              id={payloadId}
              surface="output"
              value={decoded?.payloadText ?? ""}
              readOnly
              spellCheck={false}
              placeholder="Decoded payload will appear here."
              className="min-h-36 lg:min-h-44"
            />
          </div>
        </div>
      </div>

      {decoded ? (
        <div className="space-y-3">
          <Feedback tone="success" live>
            {decoded.signaturePresent
              ? "Header and payload decoded. A signature segment is present and was not verified."
              : "Header and payload decoded. No signature segment was provided."}
          </Feedback>
          {decoded.times.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full min-w-[20rem] text-left text-sm">
                <caption className="sr-only">JWT time claims</caption>
                <thead className="bg-editor-alt text-muted">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Claim
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Unix
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Local
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      UTC
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {decoded.times.map((item) => (
                    <tr key={item.claim} className="border-t border-line">
                      <th scope="row" className="px-3 py-2 font-medium">
                        {item.label}
                      </th>
                      <td className="px-3 py-2 font-mono text-xs">{item.unix}</td>
                      <td className="px-3 py-2">{item.local}</td>
                      <td className="px-3 py-2">{item.utc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}

      {!hasInput && status.kind === "idle" ? (
        <Feedback tone="empty">
          Paste a JWT to decode the header and payload locally.
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
