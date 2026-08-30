export type CronWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type CronPreset =
  | { kind: "every-minute" }
  | { kind: "every-n-minutes"; n: number }
  | { kind: "hourly" }
  | { kind: "daily"; hour: number; minute: number }
  | { kind: "weekly"; hour: number; minute: number; weekday: CronWeekday }
  | { kind: "weekdays"; hour: number; minute: number };

export type CronResult =
  | { ok: true; expression: string; explanation: string }
  | { ok: false; message: string };

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const CRON_EXAMPLES = [
  {
    label: "Every minute",
    expression: "* * * * *",
    preset: { kind: "every-minute" } satisfies CronPreset,
  },
  {
    label: "Every hour",
    expression: "0 * * * *",
    preset: { kind: "hourly" } satisfies CronPreset,
  },
  {
    label: "Every day at midnight",
    expression: "0 0 * * *",
    preset: { kind: "daily", hour: 0, minute: 0 } satisfies CronPreset,
  },
  {
    label: "Every day at 9 AM",
    expression: "0 9 * * *",
    preset: { kind: "daily", hour: 9, minute: 0 } satisfies CronPreset,
  },
  {
    label: "Every Monday at 9 AM",
    expression: "0 9 * * 1",
    preset: { kind: "weekly", hour: 9, minute: 0, weekday: 1 } satisfies CronPreset,
  },
  {
    label: "Weekdays at 9 AM",
    expression: "0 9 * * 1-5",
    preset: { kind: "weekdays", hour: 9, minute: 0 } satisfies CronPreset,
  },
] as const;

function isHour(value: number) {
  return Number.isInteger(value) && value >= 0 && value <= 23;
}

function isMinute(value: number) {
  return Number.isInteger(value) && value >= 0 && value <= 59;
}

function isWeekday(value: number): value is CronWeekday {
  return Number.isInteger(value) && value >= 0 && value <= 6;
}

export function formatClock(hour: number, minute: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

export function generateCron(preset: CronPreset): CronResult {
  switch (preset.kind) {
    case "every-minute":
      return {
        ok: true,
        expression: "* * * * *",
        explanation: "Runs every minute.",
      };
    case "every-n-minutes": {
      if (!Number.isInteger(preset.n) || preset.n < 1 || preset.n > 59) {
        return {
          ok: false,
          message: "Choose an interval from 1 to 59 minutes.",
        };
      }

      if (preset.n === 1) {
        return generateCron({ kind: "every-minute" });
      }

      return {
        ok: true,
        expression: `*/${preset.n} * * * *`,
        explanation: `Runs every ${preset.n} minutes.`,
      };
    }
    case "hourly":
      return {
        ok: true,
        expression: "0 * * * *",
        explanation: "Runs at the start of every hour.",
      };
    case "daily": {
      if (!isHour(preset.hour) || !isMinute(preset.minute)) {
        return { ok: false, message: "Choose a valid hour and minute." };
      }

      return {
        ok: true,
        expression: `${preset.minute} ${preset.hour} * * *`,
        explanation: `Runs at ${formatClock(preset.hour, preset.minute)} every day.`,
      };
    }
    case "weekly": {
      if (
        !isHour(preset.hour) ||
        !isMinute(preset.minute) ||
        !isWeekday(preset.weekday)
      ) {
        return {
          ok: false,
          message: "Choose a valid time and weekday.",
        };
      }

      return {
        ok: true,
        expression: `${preset.minute} ${preset.hour} * * ${preset.weekday}`,
        explanation: `Runs at ${formatClock(preset.hour, preset.minute)} every ${WEEKDAY_LABELS[preset.weekday]}.`,
      };
    }
    case "weekdays": {
      if (!isHour(preset.hour) || !isMinute(preset.minute)) {
        return { ok: false, message: "Choose a valid hour and minute." };
      }

      return {
        ok: true,
        expression: `${preset.minute} ${preset.hour} * * 1-5`,
        explanation: `Runs at ${formatClock(preset.hour, preset.minute)} every Monday through Friday.`,
      };
    }
  }
}

export function explainCron(expression: string): CronResult {
  const match = CRON_EXAMPLES.find((item) => item.expression === expression);

  if (match) {
    return generateCron(match.preset);
  }

  const generated = [
    generateCron({ kind: "every-minute" }),
    generateCron({ kind: "hourly" }),
  ];

  for (const item of generated) {
    if (item.ok && item.expression === expression) {
      return item;
    }
  }

  const everyN = expression.match(/^(\*)\/([1-9]|[1-5]\d) \* \* \* \*$/);
  if (everyN) {
    return generateCron({
      kind: "every-n-minutes",
      n: Number(everyN[2]),
    });
  }

  const daily = expression.match(/^(\d{1,2}) (\d{1,2}) \* \* \*$/);
  if (daily) {
    return generateCron({
      kind: "daily",
      minute: Number(daily[1]),
      hour: Number(daily[2]),
    });
  }

  const weekly = expression.match(/^(\d{1,2}) (\d{1,2}) \* \* ([0-6])$/);
  if (weekly) {
    return generateCron({
      kind: "weekly",
      minute: Number(weekly[1]),
      hour: Number(weekly[2]),
      weekday: Number(weekly[3]) as CronWeekday,
    });
  }

  const weekdays = expression.match(/^(\d{1,2}) (\d{1,2}) \* \* 1-5$/);
  if (weekdays) {
    return generateCron({
      kind: "weekdays",
      minute: Number(weekdays[1]),
      hour: Number(weekdays[2]),
    });
  }

  return {
    ok: false,
    message:
      "This explainer only understands the 5-field schedules this generator can create. It does not read arbitrary cron syntax.",
  };
}
