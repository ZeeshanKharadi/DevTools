import {
  isInvoiceStatus,
  parseStoredInvoiceInput,
  type InvoiceStatus,
} from "../../../lib/tools/invoice-generator/stored";
import type { InvoiceInput } from "../../../lib/tools/invoice-generator/types";
import type { Clock } from "../clock";
import { toIso } from "../clock";
import type { Repositories } from "../db/repositories";
import type { InvoiceRecord } from "../db/types";
import { HttpError } from "../http";
import { copyRecordName, createId, parseName } from "../ids";
import { requireFeature, type EntitlementService } from "./entitlement";

export type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceDetail = InvoiceListItem & {
  data: InvoiceInput;
  warnings: string[];
};

function toListItem(record: InvoiceRecord): InvoiceListItem {
  return {
    id: record.id,
    invoiceNumber: record.invoiceNumber,
    status: isInvoiceStatus(record.status) ? record.status : "draft",
    currency: record.currency,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function parseRecord(record: InvoiceRecord): InvoiceDetail {
  let parsed: unknown;
  try {
    parsed = JSON.parse(record.invoiceData);
  } catch {
    throw new HttpError(500, "corrupt_invoice", "Saved invoice data is invalid.");
  }

  const result = parseStoredInvoiceInput(parsed);
  if (!result.ok) {
    throw new HttpError(500, "corrupt_invoice", result.message);
  }

  return {
    ...toListItem(record),
    data: result.data,
    warnings: result.warnings,
  };
}

async function ownedInvoice(
  repos: Repositories,
  userId: string,
  id: string,
): Promise<InvoiceRecord> {
  const record = await repos.invoices.findById(id);
  if (!record || record.userId !== userId) {
    throw new HttpError(404, "not_found", "Invoice not found.");
  }
  return record;
}

function parseStatus(raw: unknown, fallback: InvoiceStatus): InvoiceStatus {
  if (raw === undefined) {
    return fallback;
  }
  if (!isInvoiceStatus(raw)) {
    throw new HttpError(
      400,
      "invalid_status",
      "Status must be draft, sent, paid, or cancelled.",
    );
  }
  return raw;
}

export function createInvoiceService(
  repos: Repositories,
  clock: Clock,
  entitlements: EntitlementService,
) {
  return {
    async list(userId: string, query?: string): Promise<InvoiceListItem[]> {
      const records = await repos.invoices.listByUser(userId, query);
      return records.map(toListItem);
    },

    async get(userId: string, id: string): Promise<InvoiceDetail> {
      return parseRecord(await ownedInvoice(repos, userId, id));
    },

    async create(
      userId: string,
      input: { invoiceNumber?: unknown; status?: unknown; data?: unknown },
    ): Promise<InvoiceDetail> {
      await requireFeature(entitlements, userId, "invoices");
      const parsed = parseStoredInvoiceInput(input.data);
      if (!parsed.ok) {
        throw new HttpError(400, "invalid_invoice", parsed.message);
      }

      const invoiceNumber =
        parseName(input.invoiceNumber, 40) ??
        parseName(parsed.data.meta.number, 40) ??
        "Draft invoice";
      const now = toIso(clock.now());
      const record: InvoiceRecord = {
        id: createId(),
        userId,
        invoiceNumber,
        status: parseStatus(input.status, "draft"),
        currency: parsed.data.meta.currency,
        invoiceData: JSON.stringify(parsed.data),
        createdAt: now,
        updatedAt: now,
      };
      await repos.invoices.create(record);
      return {
        ...parseRecord(record),
        warnings: parsed.warnings,
      };
    },

    async update(
      userId: string,
      id: string,
      input: { invoiceNumber?: unknown; status?: unknown; data?: unknown },
    ): Promise<InvoiceDetail> {
      await requireFeature(entitlements, userId, "invoices");
      const existing = await ownedInvoice(repos, userId, id);
      let dataJson = existing.invoiceData;
      let currency = existing.currency;
      let warnings: string[] = [];

      if (input.data !== undefined) {
        const parsed = parseStoredInvoiceInput(input.data);
        if (!parsed.ok) {
          throw new HttpError(400, "invalid_invoice", parsed.message);
        }
        dataJson = JSON.stringify(parsed.data);
        currency = parsed.data.meta.currency;
        warnings = parsed.warnings;
      }

      const invoiceNumber =
        input.invoiceNumber === undefined
          ? existing.invoiceNumber
          : parseName(input.invoiceNumber, 40);
      if (!invoiceNumber) {
        throw new HttpError(400, "invalid_number", "Enter an invoice number.");
      }

      const updated: InvoiceRecord = {
        ...existing,
        invoiceNumber,
        status: parseStatus(input.status, existing.status as InvoiceStatus),
        currency,
        invoiceData: dataJson,
        updatedAt: toIso(clock.now()),
      };
      await repos.invoices.update(updated);
      return {
        ...parseRecord(updated),
        warnings,
      };
    },

    async duplicate(userId: string, id: string): Promise<InvoiceDetail> {
      await requireFeature(entitlements, userId, "invoices");
      const existing = await ownedInvoice(repos, userId, id);
      const now = toIso(clock.now());
      const copy: InvoiceRecord = {
        id: createId(),
        userId,
        invoiceNumber: copyRecordName(existing.invoiceNumber, 40),
        status: "draft",
        currency: existing.currency,
        invoiceData: existing.invoiceData,
        createdAt: now,
        updatedAt: now,
      };
      await repos.invoices.create(copy);
      return parseRecord(copy);
    },

    async delete(userId: string, id: string): Promise<void> {
      await requireFeature(entitlements, userId, "invoices");
      await ownedInvoice(repos, userId, id);
      await repos.invoices.delete(id, userId);
    },
  };
}
