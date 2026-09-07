"use client";

import { useId, useMemo, useState } from "react";
import { ToolWorkspace } from "@/components/tools/ToolWorkspace";
import { Button } from "@/components/ui/Button";
import { ClearButton } from "@/components/ui/ClearButton";
import { Feedback } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  CURRENCY_LABELS,
  DEFAULT_ACCENT,
  EMPTY_INPUT,
  EMPTY_PARTY,
  EXAMPLE_INPUT,
  INVOICE_CURRENCIES,
  INVOICE_TEMPLATES,
  MAX_LINE_ITEMS,
  MAX_LOGO_BYTES,
  MAX_NOTES,
  MAX_TEXT,
  TEMPLATE_META,
  downloadInvoicePdf,
  emptyLine,
  printHtmlDocument,
  renderInvoice,
  type DiscountType,
  type InvoiceCurrencyCode,
  type InvoiceInput,
  type InvoiceLineInput,
  type InvoiceParty,
  type InvoiceTemplateId,
} from "@/lib/tools/invoice-generator";

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  maxLength?: number;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function PartyFields({
  id,
  title,
  party,
  onChange,
}: {
  id: string;
  title: string;
  party: InvoiceParty;
  onChange: (party: InvoiceParty) => void;
}) {
  const fields = [
    { key: "company" as const, label: "Business / company" },
    { key: "name" as const, label: "Contact name" },
    { key: "email" as const, label: "Email", type: "email" },
    { key: "phone" as const, label: "Phone", type: "tel" },
    { key: "address" as const, label: "Address" },
    { key: "website" as const, label: "Website", type: "url" },
    { key: "taxId" as const, label: "Tax / registration ID" },
  ];

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold">{title}</legend>
      {fields.map((field) => (
        <Field
          key={field.key}
          id={`${id}-${field.key}`}
          label={field.label}
          type={field.type}
          value={party[field.key]}
          onChange={(value) => onChange({ ...party, [field.key]: value })}
        />
      ))}
    </fieldset>
  );
}

async function fileToDataUrl(file: File): Promise<string> {
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error("Keep logos under 400 KB.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a PNG, JPEG, GIF, or WebP image.");
  }
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("The logo could not be read."));
    };
    reader.onerror = () => reject(new Error("The logo could not be read."));
    reader.readAsDataURL(file);
  });
}

export default function InvoiceTool() {
  const formId = useId();
  const [input, setInput] = useState<InvoiceInput>(EXAMPLE_INPUT);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lineCount, setLineCount] = useState(EXAMPLE_INPUT.lines.length);

  const rendered = useMemo(() => renderInvoice(input), [input]);

  function patchMeta(patch: Partial<InvoiceInput["meta"]>) {
    setInput((current) => ({ ...current, meta: { ...current.meta, ...patch } }));
    setActionError(null);
  }

  function patchLine(id: string, patch: Partial<InvoiceLineInput>) {
    setInput((current) => ({
      ...current,
      lines: current.lines.map((line) =>
        line.id === id ? { ...line, ...patch } : line,
      ),
    }));
  }

  return (
    <ToolWorkspace
      label="Invoice Generator workspace"
      capabilities={["copy", "clear", "download"]}
      className="space-y-5"
    >
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <form
          className="min-w-0 space-y-6"
          onSubmit={(event) => event.preventDefault()}
        >
          <PartyFields
            id={`${formId}-seller`}
            title="Seller / business"
            party={input.seller}
            onChange={(seller) => setInput((current) => ({ ...current, seller }))}
          />
          <PartyFields
            id={`${formId}-customer`}
            title="Customer / bill to"
            party={input.customer}
            onChange={(customer) =>
              setInput((current) => ({ ...current, customer }))
            }
          />

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Invoice details</legend>
            <Field
              id={`${formId}-number`}
              label="Invoice number"
              value={input.meta.number}
              onChange={(number) => patchMeta({ number })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                id={`${formId}-issue`}
                label="Issue date"
                type="date"
                value={input.meta.issueDate}
                onChange={(issueDate) => patchMeta({ issueDate })}
              />
              <Field
                id={`${formId}-due`}
                label="Due date"
                type="date"
                value={input.meta.dueDate}
                onChange={(dueDate) => patchMeta({ dueDate })}
              />
            </div>
            <Field
              id={`${formId}-po`}
              label="PO / reference"
              value={input.meta.poNumber}
              onChange={(poNumber) => patchMeta({ poNumber })}
            />
            <div className="space-y-1">
              <label htmlFor={`${formId}-currency`} className="text-sm font-medium">
                Currency
              </label>
              <Select
                id={`${formId}-currency`}
                value={input.meta.currency}
                onChange={(event) =>
                  patchMeta({
                    currency: event.target.value as InvoiceCurrencyCode,
                  })
                }
              >
                {INVOICE_CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {CURRENCY_LABELS[code]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <label htmlFor={`${formId}-logo`} className="text-sm font-medium">
                Business logo (optional)
              </label>
              <Input
                id={`${formId}-logo`}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }
                  void fileToDataUrl(file)
                    .then((url) => {
                      setLogoError(null);
                      setInput((current) => ({ ...current, logoDataUrl: url }));
                    })
                    .catch((caught: unknown) => {
                      setInput((current) => ({ ...current, logoDataUrl: null }));
                      setLogoError(
                        caught instanceof Error
                          ? caught.message
                          : "The logo could not be read.",
                      );
                    });
                }}
              />
              {input.logoDataUrl ? (
                <Button
                  variant="ghost"
                  onClick={() =>
                    setInput((current) => ({ ...current, logoDataUrl: null }))
                  }
                >
                  Remove logo
                </Button>
              ) : null}
              {logoError ? (
                <p className="text-xs text-danger" role="alert">
                  {logoError}
                </p>
              ) : null}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Line items</legend>
            {input.lines.map((line, index) => (
              <div
                key={line.id}
                className="space-y-2 rounded-lg border border-line p-3"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Item {index + 1}
                </p>
                <Field
                  id={`${formId}-${line.id}-desc`}
                  label="Description"
                  value={line.description}
                  maxLength={MAX_TEXT}
                  onChange={(description) => patchLine(line.id, { description })}
                />
                <div className="grid gap-2 sm:grid-cols-3">
                  <Field
                    id={`${formId}-${line.id}-qty`}
                    label="Qty"
                    value={line.quantity}
                    onChange={(quantity) => patchLine(line.id, { quantity })}
                  />
                  <Field
                    id={`${formId}-${line.id}-price`}
                    label="Unit price"
                    value={line.unitPrice}
                    onChange={(unitPrice) => patchLine(line.id, { unitPrice })}
                  />
                  <Field
                    id={`${formId}-${line.id}-tax`}
                    label="Tax %"
                    value={line.taxPercent}
                    onChange={(taxPercent) => patchLine(line.id, { taxPercent })}
                  />
                </div>
                {input.lines.length > 1 ? (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setInput((current) => ({
                        ...current,
                        lines: current.lines.filter((item) => item.id !== line.id),
                      }))
                    }
                  >
                    Remove item
                  </Button>
                ) : null}
              </div>
            ))}
            <Button
              disabled={input.lines.length >= MAX_LINE_ITEMS}
              onClick={() => {
                const next = lineCount + 1;
                setLineCount(next);
                setInput((current) => ({
                  ...current,
                  lines: [...current.lines, emptyLine(`line-${next}`)],
                }));
              }}
            >
              Add line item
            </Button>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Totals</legend>
            <div className="space-y-1">
              <label htmlFor={`${formId}-discount-type`} className="text-sm font-medium">
                Discount
              </label>
              <Select
                id={`${formId}-discount-type`}
                value={input.meta.discountType}
                onChange={(event) =>
                  patchMeta({
                    discountType: event.target.value as DiscountType,
                  })
                }
              >
                <option value="none">None</option>
                <option value="percent">Percent of subtotal</option>
                <option value="amount">Fixed amount</option>
              </Select>
            </div>
            {input.meta.discountType !== "none" ? (
              <Field
                id={`${formId}-discount`}
                label={
                  input.meta.discountType === "percent"
                    ? "Discount %"
                    : "Discount amount"
                }
                value={input.meta.discountValue}
                onChange={(discountValue) => patchMeta({ discountValue })}
              />
            ) : null}
            <Field
              id={`${formId}-paid`}
              label="Amount paid"
              value={input.meta.amountPaid}
              onChange={(amountPaid) => patchMeta({ amountPaid })}
            />
            <div className="space-y-1">
              <label htmlFor={`${formId}-notes`} className="text-sm font-medium">
                Notes
              </label>
              <Textarea
                id={`${formId}-notes`}
                surface="input"
                maxLength={MAX_NOTES}
                className="min-h-24 font-sans text-base sm:text-sm"
                value={input.meta.notes}
                onChange={(event) => patchMeta({ notes: event.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor={`${formId}-terms`} className="text-sm font-medium">
                Payment terms / instructions
              </label>
              <Textarea
                id={`${formId}-terms`}
                surface="input"
                maxLength={MAX_NOTES}
                className="min-h-24 font-sans text-base sm:text-sm"
                value={input.meta.terms}
                onChange={(event) => patchMeta({ terms: event.target.value })}
              />
            </div>
            <p className="text-xs text-muted">
              Line tax is calculated on quantity × unit price. An invoice
              discount then reduces the subtotal only — it does not reduce line
              tax. Total = subtotal − discount + tax. Amount paid reduces the
              balance due.
            </p>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Style</legend>
            <div className="space-y-1">
              <label htmlFor={`${formId}-template`} className="text-sm font-medium">
                Template
              </label>
              <Select
                id={`${formId}-template`}
                value={input.options.template}
                onChange={(event) =>
                  setInput((current) => ({
                    ...current,
                    options: {
                      ...current.options,
                      template: event.target.value as InvoiceTemplateId,
                    },
                  }))
                }
              >
                {INVOICE_TEMPLATES.map((template) => (
                  <option key={template} value={template}>
                    {TEMPLATE_META[template].label}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted">
                {TEMPLATE_META[input.options.template].description}
              </p>
            </div>
            <div className="space-y-1">
              <label htmlFor={`${formId}-accent`} className="text-sm font-medium">
                Accent color
              </label>
              <input
                id={`${formId}-accent`}
                type="color"
                value={input.options.accentColor}
                onChange={(event) =>
                  setInput((current) => ({
                    ...current,
                    options: {
                      ...current.options,
                      accentColor: event.target.value || DEFAULT_ACCENT,
                    },
                  }))
                }
                className="h-10 w-14 cursor-pointer rounded-md border border-line bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              />
            </div>
          </fieldset>
        </form>

        <div className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-xl border border-line bg-canvas">
            <div className="border-b border-line bg-panel px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Live invoice preview
              </p>
              <p className="mt-1 text-sm text-foreground">
                Print and PDF export only the invoice document, not this editor.
              </p>
            </div>
            <div className="bg-white">
              {rendered.ok ? (
                <iframe
                  title="Invoice preview"
                  sandbox=""
                  srcDoc={rendered.document}
                  className="min-h-[40rem] w-full border-0 bg-white"
                  style={{ colorScheme: "light" }}
                />
              ) : (
                <p className="p-6 text-sm text-muted">{rendered.message}</p>
              )}
            </div>
          </div>

          <Feedback>
            Totals stay on this device. This is not tax, accounting, or legal
            advice, and it does not claim to meet every country&apos;s invoice
            rules. Saved invoices, payment links, and cloud sync are not part of
            this browser-only generator.
          </Feedback>

          {rendered.ok
            ? rendered.warnings.map((warning) => (
                <Feedback key={warning}>{warning}</Feedback>
              ))
            : (
              <Feedback tone="error" live>
                {rendered.message}
              </Feedback>
            )}

          {actionError ? (
            <Feedback tone="error" live>
              {actionError}
            </Feedback>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              variant="primary"
              disabled={!rendered.ok}
              onClick={() => {
                if (rendered.ok) {
                  try {
                    printHtmlDocument(rendered.document);
                  } catch (error) {
                    setActionError(
                      error instanceof Error
                        ? error.message
                        : "Could not open print.",
                    );
                  }
                }
              }}
            >
              Print
            </Button>
            <Button
              disabled={!rendered.ok}
              onClick={() => {
                void downloadInvoicePdf(input).then((result) => {
                  if (!result.ok) {
                    setActionError(result.message);
                  }
                });
              }}
            >
              Download PDF
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setInput(EXAMPLE_INPUT);
                setActionError(null);
                setLogoError(null);
              }}
            >
              Load example
            </Button>
            <ClearButton
              label="Reset"
              variant="ghost"
              onClear={() => {
                setInput({
                  ...EMPTY_INPUT,
                  seller: { ...EMPTY_PARTY },
                  customer: { ...EMPTY_PARTY },
                  lines: [emptyLine("line-1")],
                  meta: { ...EMPTY_INPUT.meta },
                  options: { ...EMPTY_INPUT.options },
                });
                setLineCount(1);
                setActionError(null);
                setLogoError(null);
              }}
            />
          </div>
        </div>
      </div>
    </ToolWorkspace>
  );
}
