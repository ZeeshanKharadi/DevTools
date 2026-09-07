/**
 * V1 invoices are generated entirely in the browser. Nothing is stored.
 *
 * Future Pro/server features must not be imported here: saved invoices,
 * customer directory, recurring invoices, business profiles, payment links,
 * custom branding packs, and cloud sync.
 */
export const INVOICE_GENERATION_MODE = "local" as const;

export const INVOICE_PRO_FEATURES = [
  "saved-invoices",
  "customer-directory",
  "recurring-invoices",
  "business-profiles",
  "payment-links",
  "custom-branding",
  "cloud-sync",
] as const;

export type InvoiceProFeature = (typeof INVOICE_PRO_FEATURES)[number];

export const INVOICE_TEMPLATES = ["classic", "modern", "compact"] as const;
export type InvoiceTemplateId = (typeof INVOICE_TEMPLATES)[number];

export const INVOICE_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "PKR",
  "INR",
  "AED",
  "SAR",
  "JPY",
] as const;

export type InvoiceCurrencyCode = (typeof INVOICE_CURRENCIES)[number];

export const DISCOUNT_TYPES = ["none", "percent", "amount"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export type InvoiceParty = {
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  taxId: string;
};

export type InvoiceLineInput = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  taxPercent: string;
};

export type InvoiceMeta = {
  number: string;
  issueDate: string;
  dueDate: string;
  poNumber: string;
  currency: InvoiceCurrencyCode;
  discountType: DiscountType;
  discountValue: string;
  amountPaid: string;
  notes: string;
  terms: string;
};

export type InvoiceOptions = {
  template: InvoiceTemplateId;
  accentColor: string;
};

export type InvoiceInput = {
  seller: InvoiceParty;
  customer: InvoiceParty;
  logoDataUrl: string | null;
  meta: InvoiceMeta;
  lines: InvoiceLineInput[];
  options: InvoiceOptions;
};

export type MoneyMinor = bigint;

export type InvoiceLineTotals = {
  id: string;
  description: string;
  quantityScaled: bigint;
  unitMinor: MoneyMinor;
  taxBps: bigint;
  netMinor: MoneyMinor;
  taxMinor: MoneyMinor;
  totalMinor: MoneyMinor;
};

export type InvoiceTotals = {
  currency: InvoiceCurrencyCode;
  exponent: number;
  lines: InvoiceLineTotals[];
  subtotalMinor: MoneyMinor;
  discountMinor: MoneyMinor;
  taxMinor: MoneyMinor;
  totalMinor: MoneyMinor;
  paidMinor: MoneyMinor;
  balanceMinor: MoneyMinor;
  creditMinor: MoneyMinor;
};

export type InvoiceCalcResult =
  | { ok: true; totals: InvoiceTotals; warnings: string[] }
  | { ok: false; message: string };

export type InvoiceRenderResult =
  | {
      ok: true;
      totals: InvoiceTotals;
      document: string;
      warnings: string[];
    }
  | { ok: false; message: string };
