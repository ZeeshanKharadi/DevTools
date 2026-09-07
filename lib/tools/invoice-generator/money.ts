import { INVOICE_CURRENCIES } from "./types";
import type { InvoiceCurrencyCode, MoneyMinor } from "./types";

export type CurrencyMeta = {
  code: InvoiceCurrencyCode;
  name: string;
  exponent: number;
  locale: string;
};

export const CURRENCY_META: Record<InvoiceCurrencyCode, CurrencyMeta> = {
  USD: { code: "USD", name: "US Dollar", exponent: 2, locale: "en-US" },
  EUR: { code: "EUR", name: "Euro", exponent: 2, locale: "en-IE" },
  GBP: { code: "GBP", name: "British Pound", exponent: 2, locale: "en-GB" },
  CAD: { code: "CAD", name: "Canadian Dollar", exponent: 2, locale: "en-CA" },
  AUD: { code: "AUD", name: "Australian Dollar", exponent: 2, locale: "en-AU" },
  PKR: { code: "PKR", name: "Pakistani Rupee", exponent: 2, locale: "en-PK" },
  INR: { code: "INR", name: "Indian Rupee", exponent: 2, locale: "en-IN" },
  AED: { code: "AED", name: "UAE Dirham", exponent: 2, locale: "en-AE" },
  SAR: { code: "SAR", name: "Saudi Riyal", exponent: 2, locale: "en-SA" },
  JPY: { code: "JPY", name: "Japanese Yen", exponent: 0, locale: "ja-JP" },
};

export const ZERO = BigInt(0);
export const ONE = BigInt(1);
export const TWO = BigInt(2);
export const TEN = BigInt(10);

export const QTY_SCALE = 3;
export const PERCENT_SCALE = 2;
export const PERCENT_BPS_DIVISOR = BigInt(10_000);
export const QTY_DIVISOR = TEN ** BigInt(QTY_SCALE);
export const MAX_ABS_MINOR = TEN ** BigInt(12);
export const MAX_QTY_SCALED = BigInt(1_000_000) * QTY_DIVISOR;

export function isInvoiceCurrency(value: string): value is InvoiceCurrencyCode {
  return (INVOICE_CURRENCIES as readonly string[]).includes(value);
}

export function currencyExponent(code: InvoiceCurrencyCode): number {
  return CURRENCY_META[code].exponent;
}

export function parseDecimalToScaled(
  raw: string,
  scale: number,
  label: string,
): { ok: true; value: bigint } | { ok: false; message: string } {
  const trimmed = raw.trim().replace(/,/g, "");

  if (!trimmed) {
    return { ok: false, message: `Enter ${label}.` };
  }

  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return { ok: false, message: `${label} must be a number.` };
  }

  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [wholePart, fractionPart = ""] = unsigned.split(".");

  if (fractionPart.length > scale) {
    return {
      ok: false,
      message:
        scale === 0
          ? `${label} cannot include a decimal for this currency.`
          : `${label} can have at most ${scale} decimal place${scale === 1 ? "" : "s"}.`,
    };
  }

  const whole = BigInt(wholePart || "0");
  const fraction = BigInt(fractionPart.padEnd(scale, "0") || "0");
  const magnitude = whole * TEN ** BigInt(scale) + fraction;
  const value = negative ? -magnitude : magnitude;

  return { ok: true, value };
}

export function parseMoney(
  raw: string,
  code: InvoiceCurrencyCode,
  label: string,
): { ok: true; value: MoneyMinor } | { ok: false; message: string } {
  return parseDecimalToScaled(raw, currencyExponent(code), label);
}

export function parseQuantity(
  raw: string,
): { ok: true; value: bigint } | { ok: false; message: string } {
  const parsed = parseDecimalToScaled(raw, QTY_SCALE, "Quantity");
  if (!parsed.ok) {
    return parsed;
  }
  if (parsed.value <= ZERO) {
    return { ok: false, message: "Quantity must be greater than zero." };
  }
  if (parsed.value > MAX_QTY_SCALED) {
    return { ok: false, message: "Quantity is too large." };
  }
  return parsed;
}

export function parsePercentBps(
  raw: string,
  label: string,
): { ok: true; value: bigint } | { ok: false; message: string } {
  const parsed = parseDecimalToScaled(raw.trim() === "" ? "0" : raw, PERCENT_SCALE, label);
  if (!parsed.ok) {
    return parsed;
  }
  if (parsed.value < ZERO || parsed.value > BigInt(100) * TEN ** BigInt(PERCENT_SCALE)) {
    return { ok: false, message: `${label} must be between 0 and 100.` };
  }
  return parsed;
}

export function mulDivRoundHalfUp(a: bigint, b: bigint, divisor: bigint): bigint {
  if (divisor === ZERO) {
    throw new Error("Division by zero.");
  }

  const product = a * b;
  const negative = product < ZERO;
  const absProduct = negative ? -product : product;
  const quotient = absProduct / divisor;
  const remainder = absProduct % divisor;
  const rounded =
    remainder * TWO >= divisor ? quotient + ONE : quotient;
  return negative ? -rounded : rounded;
}

export function formatScaledPlain(value: bigint, scale: number): string {
  const negative = value < ZERO;
  const abs = negative ? -value : value;
  const divisor = TEN ** BigInt(scale);
  const whole = abs / divisor;
  const fraction = abs % divisor;
  const fractionText =
    scale === 0 ? "" : `.${fraction.toString().padStart(scale, "0")}`;
  const trimmedFraction =
    scale === 0
      ? ""
      : fractionText.replace(/0+$/, "").replace(/\.$/, "");
  return `${negative ? "-" : ""}${whole.toString()}${trimmedFraction}`;
}

export function formatMoney(minor: MoneyMinor, code: InvoiceCurrencyCode): string {
  const meta = CURRENCY_META[code];
  const exponent = meta.exponent;
  const negative = minor < ZERO;
  const abs = negative ? -minor : minor;

  if (abs > MAX_ABS_MINOR) {
    return `${negative ? "-" : ""}${abs.toString()} ${code}`;
  }

  const amount = Number(abs) / 10 ** exponent;
  const signed = negative ? -amount : amount;

  try {
    return new Intl.NumberFormat(meta.locale, {
      style: "currency",
      currency: code,
      currencyDisplay: "symbol",
    }).format(signed);
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).format(signed);
  }
}

export function formatQuantity(qtyScaled: bigint): string {
  return formatScaledPlain(qtyScaled, QTY_SCALE);
}

export function formatPercent(bps: bigint): string {
  return `${formatScaledPlain(bps, PERCENT_SCALE)}%`;
}
