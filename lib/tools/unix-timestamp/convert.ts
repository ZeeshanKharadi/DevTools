export type TimestampUnit = "seconds" | "milliseconds";

export type TimestampSuccess = {
  ok: true;
  milliseconds: number;
  seconds: number;
  iso: string;
  utc: string;
  local: string;
  timeZone: string;
};

export type TimestampError = {
  ok: false;
  message: string;
};

export type TimestampResult = TimestampSuccess | TimestampError;

function formatUtc(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  const second = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second} UTC`;
}

function fromDate(date: Date): TimestampResult {
  if (Number.isNaN(date.getTime())) {
    return {
      ok: false,
      message: "This value is not a valid date.",
    };
  }

  const milliseconds = date.getTime();

  return {
    ok: true,
    milliseconds,
    seconds: Math.floor(milliseconds / 1000),
    iso: date.toISOString(),
    utc: formatUtc(date),
    local: date.toLocaleString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export function parseUnixInput(raw: string):
  | { ok: true; value: number }
  | TimestampError {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { ok: false, message: "Enter a Unix timestamp." };
  }

  if (!/^-?\d+$/.test(trimmed)) {
    return {
      ok: false,
      message:
        "Enter a whole number. Choose seconds or milliseconds explicitly — this tool does not guess the unit.",
    };
  }

  const value = Number(trimmed);

  if (!Number.isSafeInteger(value)) {
    return {
      ok: false,
      message: "This timestamp is outside the safe integer range.",
    };
  }

  return { ok: true, value };
}

export function fromUnix(
  value: number,
  unit: TimestampUnit,
): TimestampResult {
  const milliseconds = unit === "seconds" ? value * 1000 : value;
  return fromDate(new Date(milliseconds));
}

export function fromUnixInput(
  raw: string,
  unit: TimestampUnit,
): TimestampResult {
  const parsed = parseUnixInput(raw);

  if (!parsed.ok) {
    return parsed;
  }

  return fromUnix(parsed.value, unit);
}

export function fromUtcParts(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): TimestampResult {
  return fromDate(new Date(Date.UTC(year, month - 1, day, hour, minute, second)));
}

export function fromDateTimeLocal(value: string): TimestampResult {
  if (!value.trim()) {
    return { ok: false, message: "Choose a date and time." };
  }

  return fromDate(new Date(value));
}

export function currentUnix(now = Date.now()): {
  milliseconds: number;
  seconds: number;
} {
  return {
    milliseconds: now,
    seconds: Math.floor(now / 1000),
  };
}
