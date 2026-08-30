"use client";

import { useId, useMemo, useState } from "react";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { Feedback } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  CRON_EXAMPLES,
  WEEKDAY_LABELS,
  generateCron,
  type CronPreset,
  type CronWeekday,
} from "@/lib/tools/cron-generator";

type ScheduleKind = CronPreset["kind"];

function rangeOptions(from: number, to: number, pad = false) {
  return Array.from({ length: to - from + 1 }, (_, index) => {
    const value = from + index;
    return {
      value,
      label: pad ? String(value).padStart(2, "0") : String(value),
    };
  });
}

export default function CronGeneratorTool() {
  const kindId = useId();
  const intervalId = useId();
  const hourId = useId();
  const minuteId = useId();
  const weekdayId = useId();
  const errorId = useId();

  const [kind, setKind] = useState<ScheduleKind>("daily");
  const [interval, setInterval] = useState(5);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [weekday, setWeekday] = useState<CronWeekday>(1);

  const preset = useMemo<CronPreset>(() => {
    switch (kind) {
      case "every-minute":
        return { kind };
      case "every-n-minutes":
        return { kind, n: interval };
      case "hourly":
        return { kind };
      case "daily":
        return { kind, hour, minute };
      case "weekly":
        return { kind, hour, minute, weekday };
      case "weekdays":
        return { kind, hour, minute };
    }
  }, [hour, interval, kind, minute, weekday]);

  const result = generateCron(preset);
  const needsTime = kind === "daily" || kind === "weekly" || kind === "weekdays";

  function applyExample(example: (typeof CRON_EXAMPLES)[number]) {
    setKind(example.preset.kind);

    if (
      example.preset.kind === "daily" ||
      example.preset.kind === "weekly" ||
      example.preset.kind === "weekdays"
    ) {
      setHour(example.preset.hour);
      setMinute(example.preset.minute);
    }

    if (example.preset.kind === "weekly") {
      setWeekday(example.preset.weekday);
    }
  }

  return (
    <ToolWorkspace
      label="Cron Expression Generator workspace"
      capabilities={["copy"]}
      className="space-y-6"
    >
      <p className="text-xs text-muted">
        Standard 5-field cron only (minute hour day month weekday). Not Quartz,
        AWS, or 6-field cron.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={kindId} className="text-sm font-medium">
            Schedule
          </label>
          <Select
            id={kindId}
            value={kind}
            onChange={(event) => setKind(event.target.value as ScheduleKind)}
          >
            <option value="every-minute">Every minute</option>
            <option value="every-n-minutes">Every N minutes</option>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily at a time</option>
            <option value="weekly">Weekly on a weekday</option>
            <option value="weekdays">Weekdays at a time</option>
          </Select>
        </div>

        {kind === "every-n-minutes" ? (
          <div className="space-y-1">
            <label htmlFor={intervalId} className="text-sm font-medium">
              Every N minutes
            </label>
            <Input
              id={intervalId}
              type="number"
              min={1}
              max={59}
              value={interval}
              onChange={(event) => setInterval(Number(event.target.value))}
            />
          </div>
        ) : null}

        {needsTime ? (
          <>
            <div className="space-y-1">
              <label htmlFor={hourId} className="text-sm font-medium">
                Hour
              </label>
              <Select
                id={hourId}
                value={hour}
                onChange={(event) => setHour(Number(event.target.value))}
              >
                {rangeOptions(0, 23, true).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label htmlFor={minuteId} className="text-sm font-medium">
                Minute
              </label>
              <Select
                id={minuteId}
                value={minute}
                onChange={(event) => setMinute(Number(event.target.value))}
              >
                {rangeOptions(0, 59, true).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </>
        ) : null}

        {kind === "weekly" ? (
          <div className="space-y-1">
            <label htmlFor={weekdayId} className="text-sm font-medium">
              Weekday
            </label>
            <Select
              id={weekdayId}
              value={weekday}
              onChange={(event) =>
                setWeekday(Number(event.target.value) as CronWeekday)
              }
            >
              {WEEKDAY_LABELS.map((label, value) => (
                <option key={label} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </div>

      {result.ok ? (
        <div className="space-y-3">
          <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-line bg-editor px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted">Cron expression</p>
              <p className="break-all font-mono text-lg">{result.expression}</p>
            </div>
            <CopyButton value={result.expression} />
          </div>
          <Feedback tone="success" live>
            {result.explanation}
          </Feedback>
        </div>
      ) : (
        <Feedback id={errorId} tone="error" live>
          {result.message}
        </Feedback>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">
          Common examples
        </h3>
        <ul className="flex flex-wrap gap-2">
          {CRON_EXAMPLES.map((example) => (
            <li key={example.expression}>
              <Button
                variant="secondary"
                onClick={() => applyExample(example)}
                title={example.expression}
              >
                {example.label}
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </ToolWorkspace>
  );
}
