import type {
  DiscountType,
  InvoiceCurrencyCode,
  InvoiceInput,
  InvoiceLineInput,
  InvoiceOptions,
  InvoiceParty,
  InvoiceTemplateId,
} from "./types";
import { INVOICE_TEMPLATES } from "./types";

export const DEFAULT_ACCENT = "#0f6e56";
export const MAX_LOGO_BYTES = 400_000;
export const MAX_LINE_ITEMS = 40;
export const MAX_TEXT = 500;
export const MAX_NOTES = 2000;

export const TEMPLATE_META: Record<
  InvoiceTemplateId,
  { label: string; description: string }
> = {
  classic: {
    label: "Classic",
    description: "Letterhead layout with a clear items table and right-aligned totals.",
  },
  modern: {
    label: "Modern",
    description: "Accent header band, spacious type, and a highlighted balance due.",
  },
  compact: {
    label: "Compact",
    description: "Denser type and a tighter table for invoices with many lines.",
  },
};

export const EMPTY_PARTY: InvoiceParty = {
  name: "",
  company: "",
  email: "",
  phone: "",
  address: "",
  website: "",
  taxId: "",
};

export function emptyLine(id: string): InvoiceLineInput {
  return {
    id,
    description: "",
    quantity: "1",
    unitPrice: "",
    taxPercent: "0",
  };
}

export const DEFAULT_OPTIONS: InvoiceOptions = {
  template: "classic",
  accentColor: DEFAULT_ACCENT,
};

export const EMPTY_INPUT: InvoiceInput = {
  seller: { ...EMPTY_PARTY },
  customer: { ...EMPTY_PARTY },
  logoDataUrl: null,
  meta: {
    number: "",
    issueDate: "",
    dueDate: "",
    poNumber: "",
    currency: "USD",
    discountType: "none",
    discountValue: "",
    amountPaid: "0",
    notes: "",
    terms: "",
  },
  lines: [emptyLine("line-1")],
  options: { ...DEFAULT_OPTIONS },
};

export const EXAMPLE_INPUT: InvoiceInput = {
  seller: {
    name: "Alex Morgan",
    company: "Northwind Labs",
    email: "billing@northwindlabs.example",
    phone: "+1 415 555 0100",
    address: "210 Market Street, San Francisco, CA 94105",
    website: "https://northwindlabs.example",
    taxId: "US 12-3456789",
  },
  customer: {
    name: "Jordan Lee",
    company: "Contoso Studio",
    email: "ap@contoso.example",
    phone: "+1 206 555 0148",
    address: "88 Pine Street, Seattle, WA 98101",
    website: "",
    taxId: "",
  },
  logoDataUrl: null,
  meta: {
    number: "INV-1042",
    issueDate: "2026-09-07",
    dueDate: "2026-09-21",
    poNumber: "PO-7781",
    currency: "USD",
    discountType: "percent",
    discountValue: "5",
    amountPaid: "0",
    notes: "Thank you for your business. Please include the invoice number on the transfer.",
    terms: "Net 14. Bank transfer to the account on file.",
  },
  lines: [
    {
      id: "line-1",
      description: "Product design sprint (5 days)",
      quantity: "1",
      unitPrice: "2400.00",
      taxPercent: "8.5",
    },
    {
      id: "line-2",
      description: "UI kit license",
      quantity: "2",
      unitPrice: "150.00",
      taxPercent: "0",
    },
  ],
  options: { ...DEFAULT_OPTIONS },
};

export function isInvoiceTemplate(value: string): value is InvoiceTemplateId {
  return (INVOICE_TEMPLATES as readonly string[]).includes(value);
}

export function isDiscountType(value: string): value is DiscountType {
  return value === "none" || value === "percent" || value === "amount";
}

export const CURRENCY_LABELS: Record<InvoiceCurrencyCode, string> = {
  USD: "USD — US Dollar",
  EUR: "EUR — Euro",
  GBP: "GBP — British Pound",
  CAD: "CAD — Canadian Dollar",
  AUD: "AUD — Australian Dollar",
  PKR: "PKR — Pakistani Rupee",
  INR: "INR — Indian Rupee",
  AED: "AED — UAE Dirham",
  SAR: "SAR — Saudi Riyal",
  JPY: "JPY — Japanese Yen",
};
