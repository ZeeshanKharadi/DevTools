import {
  DEFAULT_OPTIONS,
  EMPTY_PARTY,
  MAX_LINE_ITEMS,
  MAX_NOTES,
  MAX_TEXT,
  emptyLine,
  isDiscountType,
  isInvoiceTemplate,
} from "./constants";
import { isInvoiceCurrency } from "./money";
import { sanitizeColor, sanitizeHttpUrl, sanitizeIsoDate, trimField, trimMultiline } from "./sanitize";
import type {
  InvoiceInput,
  InvoiceLineInput,
  InvoiceParty,
} from "./types";

function party(raw: unknown): InvoiceParty {
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const result: InvoiceParty = { ...EMPTY_PARTY };
  for (const key of Object.keys(EMPTY_PARTY) as (keyof InvoiceParty)[]) {
    result[key] =
      typeof record[key] === "string" ? trimField(record[key]).slice(0, MAX_TEXT) : "";
  }
  if (result.website) {
    result.website = sanitizeHttpUrl(result.website) ?? "";
  }
  return result;
}

function hostedLogo(raw: unknown): { url: string | null; strippedLocal: boolean } {
  if (typeof raw !== "string" || !raw.trim()) {
    return { url: null, strippedLocal: false };
  }
  const value = raw.trim();
  if (value.startsWith("data:image/")) {
    return { url: null, strippedLocal: true };
  }
  return { url: sanitizeHttpUrl(value.slice(0, 500)), strippedLocal: false };
}

export const INVOICE_STATUSES = ["draft", "sent", "paid", "cancelled"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export function isInvoiceStatus(value: unknown): value is InvoiceStatus {
  return typeof value === "string" && (INVOICE_STATUSES as readonly string[]).includes(value);
}

export function parseStoredInvoiceInput(raw: unknown):
  | { ok: true; data: InvoiceInput; warnings: string[] }
  | { ok: false; message: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "Invoice data must be an object." };
  }

  const record = raw as {
    seller?: unknown;
    customer?: unknown;
    logoDataUrl?: unknown;
    meta?: unknown;
    lines?: unknown;
    options?: unknown;
  };

  const logo = hostedLogo(record.logoDataUrl);
  const metaRaw =
    record.meta && typeof record.meta === "object"
      ? (record.meta as Record<string, unknown>)
      : {};
  const optionsRaw =
    record.options && typeof record.options === "object"
      ? (record.options as Record<string, unknown>)
      : {};

  const currency =
    typeof metaRaw.currency === "string" && isInvoiceCurrency(metaRaw.currency)
      ? metaRaw.currency
      : "USD";
  const discountType =
    typeof metaRaw.discountType === "string" && isDiscountType(metaRaw.discountType)
      ? metaRaw.discountType
      : "none";
  const template =
    typeof optionsRaw.template === "string" && isInvoiceTemplate(optionsRaw.template)
      ? optionsRaw.template
      : DEFAULT_OPTIONS.template;

  const linesRaw = Array.isArray(record.lines) ? record.lines.slice(0, MAX_LINE_ITEMS) : [];
  const lines: InvoiceLineInput[] =
    linesRaw.length > 0
      ? linesRaw.map((item, index) => {
          const line = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          return {
            id:
              typeof line.id === "string" && line.id.trim()
                ? line.id.trim().slice(0, 40)
                : `line-${index + 1}`,
            description:
              typeof line.description === "string"
                ? trimField(line.description).slice(0, MAX_TEXT)
                : "",
            quantity: typeof line.quantity === "string" ? line.quantity.slice(0, 20) : "1",
            unitPrice: typeof line.unitPrice === "string" ? line.unitPrice.slice(0, 20) : "",
            taxPercent: typeof line.taxPercent === "string" ? line.taxPercent.slice(0, 20) : "0",
          };
        })
      : [emptyLine("line-1")];

  const warnings: string[] = [];
  if (logo.strippedLocal) {
    warnings.push(
      "Local logos were not saved. Use a hosted https:// image URL if you want the logo to persist.",
    );
  }

  return {
    ok: true,
    data: {
      seller: party(record.seller),
      customer: party(record.customer),
      logoDataUrl: logo.url,
      meta: {
        number:
          typeof metaRaw.number === "string" ? trimField(metaRaw.number).slice(0, 40) : "",
        issueDate:
          typeof metaRaw.issueDate === "string"
            ? sanitizeIsoDate(metaRaw.issueDate) ?? ""
            : "",
        dueDate:
          typeof metaRaw.dueDate === "string" ? sanitizeIsoDate(metaRaw.dueDate) ?? "" : "",
        poNumber:
          typeof metaRaw.poNumber === "string" ? trimField(metaRaw.poNumber).slice(0, 40) : "",
        currency,
        discountType,
        discountValue:
          typeof metaRaw.discountValue === "string" ? metaRaw.discountValue.slice(0, 20) : "",
        amountPaid:
          typeof metaRaw.amountPaid === "string" ? metaRaw.amountPaid.slice(0, 20) : "0",
        notes:
          typeof metaRaw.notes === "string" ? trimMultiline(metaRaw.notes).slice(0, MAX_NOTES) : "",
        terms:
          typeof metaRaw.terms === "string" ? trimMultiline(metaRaw.terms).slice(0, MAX_NOTES) : "",
      },
      lines,
      options: {
        template,
        accentColor: sanitizeColor(
          typeof optionsRaw.accentColor === "string" ? optionsRaw.accentColor : "",
          DEFAULT_OPTIONS.accentColor,
        ),
      },
    },
    warnings,
  };
}
