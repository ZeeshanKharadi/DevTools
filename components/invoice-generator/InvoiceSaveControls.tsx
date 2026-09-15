"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { createInvoice, updateInvoice } from "@/lib/pro/api";
import { ApiError } from "@/lib/pro/client";
import type { InvoiceInput } from "@/lib/tools/invoice-generator";
import { INVOICE_STATUSES, type InvoiceStatus } from "@/lib/tools/invoice-generator/stored";

type InvoiceSaveControlsProps = {
  input: InvoiceInput;
  savedId: string | null;
  savedNumber: string;
  savedStatus: InvoiceStatus;
  onSaved: (id: string, number: string, status: InvoiceStatus, warnings: string[]) => void;
};

export function InvoiceSaveControls({
  input,
  savedId,
  savedNumber,
  savedStatus,
  onSaved,
}: InvoiceSaveControlsProps) {
  const { user, loading } = useAuth();
  const [invoiceNumber, setInvoiceNumber] = useState(savedNumber || input.meta.number);
  const [status, setStatus] = useState<InvoiceStatus>(savedStatus);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <Feedback>
        Sign in to save this invoice to your account. Print and PDF still work
        without signing in.{" "}
        <Link
          href="/login"
          className="font-medium text-foreground hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          Sign in
        </Link>
      </Feedback>
    );
  }

  async function save(asNew: boolean) {
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const result =
        savedId && !asNew
          ? await updateInvoice(savedId, {
              invoiceNumber,
              status,
              data: input,
            })
          : await createInvoice({ invoiceNumber, status, data: input });
      onSaved(
        result.invoice.id,
        result.invoice.invoiceNumber,
        result.invoice.status,
        result.invoice.warnings,
      );
      const warningText = result.invoice.warnings[0];
      setSuccess(
        warningText
          ? `Invoice saved. ${warningText}`
          : savedId && !asNew
            ? "Invoice saved."
            : "Invoice created.",
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not save.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-line bg-panel p-3">
      <p className="text-sm font-medium">Save invoice</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="invoice-save-number" className="text-xs text-muted">
            Invoice number
          </label>
          <Input
            id="invoice-save-number"
            value={invoiceNumber}
            onChange={(event) => setInvoiceNumber(event.target.value)}
            placeholder="INV-1042"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="invoice-save-status" className="text-xs text-muted">
            Status
          </label>
          <Select
            id="invoice-save-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as InvoiceStatus)}
          >
            {INVOICE_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" disabled={pending} onClick={() => void save(false)}>
          {pending ? "Saving…" : savedId ? "Save changes" : "Save invoice"}
        </Button>
        {savedId ? (
          <Button disabled={pending} onClick={() => void save(true)}>
            Save as new
          </Button>
        ) : null}
      </div>
      {success ? (
        <Feedback tone="success" live>
          {success}
        </Feedback>
      ) : null}
      {error ? (
        <Feedback tone="error" live>
          {error}
        </Feedback>
      ) : null}
    </div>
  );
}
