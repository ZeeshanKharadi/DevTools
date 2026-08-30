"use client";

import { useId, useState } from "react";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Button } from "@/components/ui/Button";
import { ClearButton } from "@/components/ui/ClearButton";
import { CopyButton } from "@/components/ui/CopyButton";
import { Feedback } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Input";
import {
  MAX_UUID_COUNT,
  MIN_UUID_COUNT,
  generateUuids,
} from "@/lib/tools/uuid-generator";

export default function UuidGeneratorTool() {
  const countId = useId();
  const errorId = useId();
  const listId = useId();

  const [count, setCount] = useState("1");
  const [uuids, setUuids] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    const result = generateUuids(Number(count));

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setError(null);
    setUuids(result.uuids);
  }

  function handleClear() {
    setUuids([]);
    setError(null);
    setCount("1");
  }

  return (
    <ToolWorkspace
      label="UUID Generator workspace"
      capabilities={["copy", "clear"]}
      className="space-y-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-32 max-w-40 space-y-1">
          <label htmlFor={countId} className="text-sm font-medium text-foreground">
            Count
          </label>
          <Input
            id={countId}
            type="number"
            inputMode="numeric"
            min={MIN_UUID_COUNT}
            max={MAX_UUID_COUNT}
            value={count}
            onChange={(event) => {
              setCount(event.target.value);
              setError(null);
            }}
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? true : undefined}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={handleGenerate}>
            Generate UUID
          </Button>
          <CopyButton
            value={uuids.join("\n")}
            label={uuids.length > 1 ? "Copy all" : "Copy"}
          />
          <ClearButton
            onClear={handleClear}
            disabled={uuids.length === 0 && count === "1"}
            variant="ghost"
          />
        </div>
      </div>

      <p className="text-xs text-muted">
        UUID v4 via crypto.randomUUID(). {MIN_UUID_COUNT}–{MAX_UUID_COUNT} per
        click.
      </p>

      {error ? (
        <Feedback id={errorId} tone="error" live>
          {error}
        </Feedback>
      ) : null}

      {uuids.length === 0 && !error ? (
        <Feedback tone="empty">
          Click Generate UUID to create a random UUID v4.
        </Feedback>
      ) : null}

      {uuids.length > 0 ? (
        <div className="space-y-2">
          <Feedback tone="success" live>
            Generated {uuids.length} UUID{uuids.length === 1 ? "" : "s"}.
          </Feedback>
          <ul id={listId} className="space-y-2">
            {uuids.map((uuid, index) => (
              <li
                key={`${uuid}-${index}`}
                className="flex min-w-0 flex-col gap-2 rounded-lg border border-line bg-editor px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <code className="min-w-0 break-all font-mono text-sm">
                  {uuid}
                </code>
                <CopyButton value={uuid} label="Copy" />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </ToolWorkspace>
  );
}
