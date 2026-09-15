"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardShell, RequireAuth, formatWhen } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  deleteInvoice,
  duplicateInvoice,
  listInvoices,
  updateInvoice,
} from "@/lib/pro/api";
import { ApiError } from "@/lib/pro/client";
import type { InvoiceListItem } from "@/lib/pro/client";
import { INVOICE_STATUSES, type InvoiceStatus } from "@/lib/tools/invoice-generator/stored";

export function InvoicesView() {
  const [items, setItems] = useState<InvoiceListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  function load(search = query) {
    void listInvoices(search)
      .then((result) => {
        setItems(result.invoices);
        setError(null);
      })
      .catch((caught) => {
        setError(caught instanceof ApiError ? caught.message : "Could not load invoices.");
      });
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStatus(item: InvoiceListItem, status: InvoiceStatus) {
    setBusyId(item.id);
    setError(null);
    try {
      const result = await updateInvoice(item.id, { status });
      setItems((current) =>
        (current ?? []).map((entry) => (entry.id === item.id ? result.invoice : entry)),
      );
      setSuccess(`Marked ${result.invoice.invoiceNumber} as ${status}.`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not update status.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDuplicate(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const result = await duplicateInvoice(id);
      setItems((current) => [result.invoice, ...(current ?? [])]);
      setSuccess("Invoice duplicated as a draft.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not duplicate.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this saved invoice?")) {
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      await deleteInvoice(id);
      setItems((current) => (current ?? []).filter((item) => item.id !== id));
      setSuccess("Invoice deleted.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not delete.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <RequireAuth label="invoices">
      <DashboardShell
        title="Invoices"
        description="Saved invoices store structured data, not PDF files. Print and PDF still use the existing generator."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <form
            className="flex min-w-0 flex-1 gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              load(query);
            }}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <label htmlFor="invoice-search" className="text-sm font-medium">
                Search
              </label>
              <Input
                id="invoice-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Number, status, or customer"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
          <Link
            href="/tools/invoice-generator"
            className="inline-flex items-center justify-center rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Create Invoice
          </Link>
        </div>
        {error ? (
          <Feedback tone="error" live>
            {error}
          </Feedback>
        ) : null}
        {success ? (
          <Feedback tone="success" live>
            {success}
          </Feedback>
        ) : null}
        {items === null && !error ? (
          <p className="text-sm text-muted">Loading invoices…</p>
        ) : null}
        {items && items.length === 0 ? (
          <Feedback>
            No saved invoices match this search. The free generator still works
            without signing in.
          </Feedback>
        ) : null}
        {items && items.length > 0 ? (
          <ul className="space-y-3">
            {items.map((invoice) => (
              <li
                key={invoice.id}
                className="flex flex-col gap-3 rounded-xl border border-line bg-panel p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-muted">
                    {invoice.currency} · Updated {formatWhen(invoice.updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    aria-label={`Status for ${invoice.invoiceNumber}`}
                    value={invoice.status}
                    disabled={busyId === invoice.id}
                    onChange={(event) =>
                      void handleStatus(invoice, event.target.value as InvoiceStatus)
                    }
                    className="w-auto"
                  >
                    {INVOICE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                  <Link
                    href={`/tools/invoice-generator?invoice=${invoice.id}`}
                    className="inline-flex items-center justify-center rounded-md border border-line bg-panel px-3 py-2 text-sm font-medium text-foreground hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    Open / Preview
                  </Link>
                  <Button
                    disabled={busyId === invoice.id}
                    onClick={() => void handleDuplicate(invoice.id)}
                  >
                    Duplicate
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={busyId === invoice.id}
                    onClick={() => void handleDelete(invoice.id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </DashboardShell>
    </RequireAuth>
  );
}
