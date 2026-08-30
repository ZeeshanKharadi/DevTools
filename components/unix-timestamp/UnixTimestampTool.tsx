"use client";

import { useId, useMemo, useState } from "react";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Button } from "@/components/ui/Button";
import { ClearButton } from "@/components/ui/ClearButton";
import { CopyButton } from "@/components/ui/CopyButton";
import { Feedback } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Input";
import {
  currentUnix,
  fromDateTimeLocal,
  fromUnixInput,
  type TimestampSuccess,
  type TimestampUnit,
} from "@/lib/tools/unix-timestamp";

function ResultFields({ result }: { result: TimestampSuccess }) {
  const rows = [
    { label: "Unix seconds", value: String(result.seconds) },
    { label: "Unix milliseconds", value: String(result.milliseconds) },
    { label: "ISO 8601", value: result.iso },
    { label: "UTC", value: result.utc },
    { label: "Local", value: `${result.local} (${result.timeZone})` },
  ];

  return (
    <dl className="space-y-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex min-w-0 flex-col gap-2 rounded-lg border border-line bg-editor px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <dt className="text-xs font-medium text-muted">{row.label}</dt>
            <dd className="break-all font-mono text-sm">{row.value}</dd>
          </div>
          <CopyButton value={row.value} />
        </div>
      ))}
    </dl>
  );
}

export default function UnixTimestampTool() {
  const timestampId = useId();
  const dateId = useId();
  const unitName = useId();
  const errorId = useId();

  const [timestamp, setTimestamp] = useState("");
  const [unit, setUnit] = useState<TimestampUnit>("seconds");
  const [dateLocal, setDateLocal] = useState("");
  const [fromTs, setFromTs] = useState<TimestampSuccess | null>(null);
  const [fromDate, setFromDate] = useState<TimestampSuccess | null>(null);
  const [now, setNow] = useState(() => currentUnix());
  const [error, setError] = useState<string | null>(null);

  const timeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  function convertTimestamp() {
    const result = fromUnixInput(timestamp, unit);

    if (!result.ok) {
      setFromTs(null);
      setError(result.message);
      return;
    }

    setError(null);
    setFromTs(result);
  }

  function convertDate() {
    const result = fromDateTimeLocal(dateLocal);

    if (!result.ok) {
      setFromDate(null);
      setError(result.message);
      return;
    }

    setError(null);
    setFromDate(result);
  }

  function handleClear() {
    setTimestamp("");
    setDateLocal("");
    setFromTs(null);
    setFromDate(null);
    setError(null);
    setUnit("seconds");
  }

  return (
    <ToolWorkspace
      label="Unix Timestamp workspace"
      capabilities={["copy", "clear"]}
      className="space-y-6"
    >
      <p className="text-xs text-muted">
        Seconds and milliseconds are explicit. Local timezone: {timeZone}.
      </p>

      <section className="space-y-3 rounded-xl border border-line bg-canvas p-4">
        <h3 className="text-sm font-semibold text-foreground">
          Current Unix timestamp
        </h3>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-line bg-editor px-3 py-2">
            <div>
              <p className="text-xs text-muted">Seconds</p>
              <p className="font-mono text-sm">{now.seconds}</p>
            </div>
            <CopyButton value={String(now.seconds)} />
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-line bg-editor px-3 py-2">
            <div>
              <p className="text-xs text-muted">Milliseconds</p>
              <p className="font-mono text-sm">{now.milliseconds}</p>
            </div>
            <CopyButton value={String(now.milliseconds)} />
          </div>
        </div>
        <Button onClick={() => setNow(currentUnix())}>Refresh now</Button>
      </section>

      <section className="space-y-3 rounded-xl border border-line bg-canvas p-4">
        <h3 className="text-sm font-semibold text-foreground">
          Timestamp → date
        </h3>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-1">
            <label htmlFor={timestampId} className="text-sm font-medium">
              Unix timestamp
            </label>
            <Input
              id={timestampId}
              inputMode="numeric"
              value={timestamp}
              onChange={(event) => {
                setTimestamp(event.target.value);
                setError(null);
              }}
              placeholder="1516239022"
              aria-describedby={error ? errorId : undefined}
            />
          </div>
          <fieldset className="space-y-1">
            <legend className="text-sm font-medium">Unit</legend>
            <div className="flex flex-wrap gap-4 py-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={unitName}
                  checked={unit === "seconds"}
                  onChange={() => setUnit("seconds")}
                />
                Seconds
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={unitName}
                  checked={unit === "milliseconds"}
                  onChange={() => setUnit("milliseconds")}
                />
                Milliseconds
              </label>
            </div>
          </fieldset>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={convertTimestamp}>
            Convert to date
          </Button>
        </div>
        {fromTs ? <ResultFields result={fromTs} /> : null}
      </section>

      <section className="space-y-3 rounded-xl border border-line bg-canvas p-4">
        <h3 className="text-sm font-semibold text-foreground">
          Date → timestamp
        </h3>
        <div className="max-w-sm space-y-1">
          <label htmlFor={dateId} className="text-sm font-medium">
            Local date and time
          </label>
          <Input
            id={dateId}
            type="datetime-local"
            step={1}
            value={dateLocal}
            onChange={(event) => {
              setDateLocal(event.target.value);
              setError(null);
            }}
          />
        </div>
        <Button variant="primary" onClick={convertDate}>
          Convert to Unix
        </Button>
        {fromDate ? <ResultFields result={fromDate} /> : null}
      </section>

      <div className="flex flex-wrap gap-2">
        <ClearButton
          onClear={handleClear}
          disabled={!timestamp && !dateLocal && !fromTs && !fromDate}
          variant="ghost"
        />
      </div>

      {error ? (
        <Feedback id={errorId} tone="error" live>
          {error}
        </Feedback>
      ) : null}
    </ToolWorkspace>
  );
}
