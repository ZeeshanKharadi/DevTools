import { calculateInvoice } from "./calculate";
import { DEFAULT_ACCENT, MAX_NOTES, TEMPLATE_META, isInvoiceTemplate } from "./constants";
import {
  ZERO,
  formatMoney,
  formatPercent,
  formatQuantity,
} from "./money";
import {
  escapeAttribute,
  escapeHtml,
  formatIsoDate,
  present,
  sanitizeColor,
  sanitizeDataImageUrl,
  sanitizeEmail,
  sanitizeHttpUrl,
  sanitizeIsoDate,
  sanitizePhone,
  trimField,
  capMultiline,
} from "./sanitize";
import type {
  InvoiceInput,
  InvoiceParty,
  InvoiceRenderResult,
  InvoiceTemplateId,
  InvoiceTotals,
} from "./types";

type PartyView = {
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  websiteHref: string;
  taxId: string;
};

type LineView = {
  description: string;
  quantity: string;
  unit: string;
  tax: string;
  net: string;
};

type InvoiceView = {
  template: InvoiceTemplateId;
  accent: string;
  logoSrc: string | null;
  number: string;
  issueDate: string;
  dueDate: string;
  poNumber: string;
  currency: string;
  seller: PartyView;
  customer: PartyView;
  lines: LineView[];
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  paid: string;
  balance: string;
  notes: string;
  terms: string;
  showDiscount: boolean;
  notesTrimmed: boolean;
  termsTrimmed: boolean;
};

function partyView(party: InvoiceParty): PartyView {
  const websiteHref = party.website.trim()
    ? sanitizeHttpUrl(party.website)
    : null;
  const email = party.email.trim() ? sanitizeEmail(party.email) : null;
  const phone = party.phone.trim() ? sanitizePhone(party.phone) : null;

  return {
    name: trimField(party.name),
    company: trimField(party.company),
    email: email ?? "",
    phone: phone ?? "",
    address: trimField(party.address),
    website: websiteHref ? websiteHref.replace(/^https?:\/\//, "").replace(/\/$/, "") : "",
    websiteHref: websiteHref ?? "",
    taxId: trimField(party.taxId),
  };
}

function partyBlock(party: PartyView, heading: string): string {
  const lines = [
    party.company ? `<strong>${escapeHtml(party.company)}</strong>` : "",
    party.name ? escapeHtml(party.name) : "",
    party.address
      ? escapeHtml(party.address).replace(/\n/g, "<br/>")
      : "",
    party.email ? escapeHtml(party.email) : "",
    party.phone ? escapeHtml(party.phone) : "",
    party.websiteHref
      ? `<a href="${escapeAttribute(party.websiteHref)}">${escapeHtml(party.website)}</a>`
      : "",
    party.taxId ? escapeHtml(party.taxId) : "",
  ].filter(Boolean);

  return `<div class="party"><p class="kicker">${escapeHtml(heading)}</p>${lines.map((line) => `<p>${line}</p>`).join("")}</div>`;
}

function metaRow(label: string, value: string): string {
  if (!value) {
    return "";
  }

  return `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`;
}

function itemsTable(view: InvoiceView): string {
  const rows = view.lines
    .map(
      (line) => `<tr>
        <td>${escapeHtml(line.description)}</td>
        <td class="num">${escapeHtml(line.quantity)}</td>
        <td class="num">${escapeHtml(line.unit)}</td>
        <td class="num">${escapeHtml(line.tax)}</td>
        <td class="num">${escapeHtml(line.net)}</td>
      </tr>`,
    )
    .join("");

  return `<table class="items">
    <thead>
      <tr>
        <th>Description</th>
        <th class="num">Qty</th>
        <th class="num">Unit</th>
        <th class="num">Tax</th>
        <th class="num">Amount</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function totalsTable(view: InvoiceView): string {
  const discountRow = view.showDiscount
    ? `<tr><th>Discount</th><td>−${escapeHtml(view.discount)}</td></tr>`
    : "";

  return `<table class="totals">
    <tr><th>Subtotal</th><td>${escapeHtml(view.subtotal)}</td></tr>
    ${discountRow}
    <tr><th>Tax</th><td>${escapeHtml(view.tax)}</td></tr>
    <tr class="total"><th>Total</th><td>${escapeHtml(view.total)}</td></tr>
    <tr><th>Amount paid</th><td>${escapeHtml(view.paid)}</td></tr>
    <tr class="balance"><th>Balance due</th><td>${escapeHtml(view.balance)}</td></tr>
  </table>`;
}

function notes(view: InvoiceView): string {
  const blocks = [
    view.notes
      ? `<div class="note"><p class="kicker">Notes</p><p>${escapeHtml(view.notes)}</p></div>`
      : "",
    view.terms
      ? `<div class="note"><p class="kicker">Payment terms</p><p>${escapeHtml(view.terms)}</p></div>`
      : "",
  ].filter(Boolean);

  return blocks.length ? `<div class="notes">${blocks.join("")}</div>` : "";
}

function documentCss(accent: string, template: InvoiceTemplateId): string {
  const compact = template === "compact";
  const modern = template === "modern";

  return `
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #1b1914;
      background: #fff;
      font-size: ${compact ? "11px" : "13px"};
      line-height: 1.45;
    }
    .sheet { padding: ${modern ? "0" : "8px 4px"}; }
    .hero {
      background: ${modern ? accent : "transparent"};
      color: ${modern ? "#fff" : "#1b1914"};
      padding: ${modern ? "28px 32px 24px" : "0 0 18px"};
    }
    .top { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; flex-wrap: wrap; }
    .brand { display: flex; gap: 14px; align-items: center; }
    .brand img { max-height: 56px; max-width: 140px; }
    h1 { font-size: ${compact ? "22px" : "28px"}; margin: 0 0 6px; letter-spacing: 0.04em; }
    .kicker { text-transform: uppercase; letter-spacing: 0.08em; font-size: 10px; font-weight: 700; margin: 0 0 6px; color: ${modern ? "#d9fff2" : accent}; }
    .parties { display: flex; gap: 32px; margin: 22px 0; padding: ${modern ? "8px 32px 0" : "0"}; flex-wrap: wrap; }
    .party { flex: 1; min-width: 180px; }
    .party p { margin: 0 0 2px; overflow-wrap: anywhere; }
    .meta { border-collapse: collapse; }
    .meta th { text-align: left; padding: 2px 16px 2px 0; font-weight: 600; color: ${modern ? "#eafaf4" : "#5e594f"}; }
    .meta td { text-align: right; padding: 2px 0; }
    .body { padding: ${modern ? "8px 32px 32px" : "0"}; }
    table.items { width: 100%; border-collapse: collapse; margin: 8px 0 20px; }
    table.items th { text-align: left; border-bottom: 2px solid ${accent}; padding: 8px 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
    table.items td { border-bottom: 1px solid #e6e0d4; padding: ${compact ? "6px" : "10px"} 6px; vertical-align: top; overflow-wrap: anywhere; }
    table.items tr { page-break-inside: avoid; }
    .num { text-align: right; white-space: nowrap; }
    .totals-wrap { display: flex; justify-content: flex-end; page-break-inside: avoid; }
    table.totals { min-width: 260px; border-collapse: collapse; }
    table.totals th { text-align: left; padding: 5px 16px 5px 0; font-weight: 600; }
    table.totals td { text-align: right; padding: 5px 0; }
    table.totals .total th, table.totals .total td { border-top: 1px solid #d9d2c4; font-size: 15px; }
    table.totals .balance th, table.totals .balance td { color: ${accent}; font-size: 16px; }
    .notes { margin-top: 28px; display: flex; gap: 24px; flex-wrap: wrap; page-break-inside: avoid; }
    .note { flex: 1; min-width: 180px; }
    .note p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
  `;
}

function classicBody(view: InvoiceView): string {
  const logo = view.logoSrc
    ? `<img src="${escapeAttribute(view.logoSrc)}" alt="" />`
    : "";

  return `<div class="sheet">
    <div class="top">
      <div class="brand">${logo}<div>
        <h1>INVOICE</h1>
        <p>${escapeHtml(view.seller.company || view.seller.name || "Seller")}</p>
      </div></div>
      <table class="meta">
        ${metaRow("Invoice", view.number)}
        ${metaRow("Issue date", view.issueDate)}
        ${metaRow("Due date", view.dueDate)}
        ${metaRow("PO / ref", view.poNumber)}
        ${metaRow("Currency", view.currency)}
      </table>
    </div>
    <div class="parties">
      ${partyBlock(view.seller, "From")}
      ${partyBlock(view.customer, "Bill to")}
    </div>
    ${itemsTable(view)}
    <div class="totals-wrap">${totalsTable(view)}</div>
    ${notes(view)}
  </div>`;
}

function modernBody(view: InvoiceView): string {
  const logo = view.logoSrc
    ? `<img src="${escapeAttribute(view.logoSrc)}" alt="" />`
    : "";

  return `<div class="sheet">
    <div class="hero">
      <div class="top">
        <div class="brand">${logo}<div>
          <p class="kicker">Invoice</p>
          <h1>${escapeHtml(view.number || "Invoice")}</h1>
        </div></div>
        <table class="meta">
          ${metaRow("Issued", view.issueDate)}
          ${metaRow("Due", view.dueDate)}
          ${metaRow("PO / ref", view.poNumber)}
        </table>
      </div>
    </div>
    <div class="body">
      <div class="parties">
        ${partyBlock(view.seller, "From")}
        ${partyBlock(view.customer, "Bill to")}
      </div>
      ${itemsTable(view)}
      <div class="totals-wrap">${totalsTable(view)}</div>
      ${notes(view)}
    </div>
  </div>`;
}

function compactBody(view: InvoiceView): string {
  const logo = view.logoSrc
    ? `<img src="${escapeAttribute(view.logoSrc)}" alt="" />`
    : "";

  return `<div class="sheet">
    <div class="top">
      <div class="brand">${logo}<div>
        <p class="kicker">Invoice ${escapeHtml(view.number)}</p>
        <h1>${escapeHtml(view.seller.company || view.seller.name || "Invoice")}</h1>
      </div></div>
      <table class="meta">
        ${metaRow("Issued", view.issueDate)}
        ${metaRow("Due", view.dueDate)}
        ${metaRow("PO", view.poNumber)}
        ${metaRow("CCY", view.currency)}
      </table>
    </div>
    <div class="parties">
      ${partyBlock(view.seller, "From")}
      ${partyBlock(view.customer, "Bill to")}
    </div>
    ${itemsTable(view)}
    <div class="totals-wrap">${totalsTable(view)}</div>
    ${notes(view)}
  </div>`;
}

function bodyFor(view: InvoiceView): string {
  switch (view.template) {
    case "modern":
      return modernBody(view);
    case "compact":
      return compactBody(view);
    default:
      return classicBody(view);
  }
}

export function prepareInvoiceView(
  input: InvoiceInput,
  totals: InvoiceTotals,
): InvoiceView {
  const template = isInvoiceTemplate(input.options.template)
    ? input.options.template
    : "classic";
  const issue = input.meta.issueDate.trim()
    ? sanitizeIsoDate(input.meta.issueDate)
    : "";
  const due = input.meta.dueDate.trim()
    ? sanitizeIsoDate(input.meta.dueDate)
    : "";

  const notes = capMultiline(input.meta.notes, MAX_NOTES);
  const terms = capMultiline(input.meta.terms, MAX_NOTES);

  return {
    template,
    accent: sanitizeColor(input.options.accentColor, DEFAULT_ACCENT),
    logoSrc: input.logoDataUrl ? sanitizeDataImageUrl(input.logoDataUrl) : null,
    number: trimField(input.meta.number),
    issueDate: issue ? formatIsoDate(issue) : "",
    dueDate: due ? formatIsoDate(due) : "",
    poNumber: trimField(input.meta.poNumber),
    currency: totals.currency,
    seller: partyView(input.seller),
    customer: partyView(input.customer),
    lines: totals.lines.map((line) => ({
      description: line.description,
      quantity: formatQuantity(line.quantityScaled),
      unit: formatMoney(line.unitMinor, totals.currency),
      tax: formatPercent(line.taxBps),
      net: formatMoney(line.netMinor, totals.currency),
    })),
    subtotal: formatMoney(totals.subtotalMinor, totals.currency),
    discount: formatMoney(totals.discountMinor, totals.currency),
    tax: formatMoney(totals.taxMinor, totals.currency),
    total: formatMoney(totals.totalMinor, totals.currency),
    paid: formatMoney(totals.paidMinor, totals.currency),
    balance: formatMoney(totals.balanceMinor, totals.currency),
    notes: notes.text,
    terms: terms.text,
    showDiscount: totals.discountMinor > ZERO,
    notesTrimmed: notes.trimmed,
    termsTrimmed: terms.trimmed,
  };
}

export function renderInvoice(input: InvoiceInput): InvoiceRenderResult {
  const calc = calculateInvoice(input);

  if (!calc.ok) {
    return calc;
  }

  const warnings = [...calc.warnings];

  if (input.seller.email.trim() && !sanitizeEmail(input.seller.email)) {
    warnings.push("Seller email was omitted because it is not a valid address.");
  }
  if (input.customer.email.trim() && !sanitizeEmail(input.customer.email)) {
    warnings.push("Customer email was omitted because it is not a valid address.");
  }
  if (input.seller.website.trim() && !sanitizeHttpUrl(input.seller.website)) {
    warnings.push("Seller website was omitted. Use an http or https URL.");
  }
  if (input.customer.website.trim() && !sanitizeHttpUrl(input.customer.website)) {
    warnings.push("Customer website was omitted. Use an http or https URL.");
  }
  if (input.meta.issueDate.trim() && !sanitizeIsoDate(input.meta.issueDate)) {
    warnings.push("Issue date was omitted because it is not a valid date.");
  }
  if (input.meta.dueDate.trim() && !sanitizeIsoDate(input.meta.dueDate)) {
    warnings.push("Due date was omitted because it is not a valid date.");
  }
  if (
    present(input.meta.issueDate) &&
    present(input.meta.dueDate) &&
    sanitizeIsoDate(input.meta.issueDate) &&
    sanitizeIsoDate(input.meta.dueDate) &&
    input.meta.dueDate < input.meta.issueDate
  ) {
    warnings.push("Due date is before the issue date.");
  }
  if (input.logoDataUrl && !sanitizeDataImageUrl(input.logoDataUrl)) {
    warnings.push("Logo was omitted. Use a PNG, JPEG, GIF, or WebP image.");
  }
  if (
    input.logoDataUrl &&
    sanitizeDataImageUrl(input.logoDataUrl) &&
    !/^data:image\/(png|jpeg|jpg);/i.test(input.logoDataUrl)
  ) {
    warnings.push(
      "GIF and WebP logos appear in the preview and printout. Download PDF embeds PNG or JPEG logos only.",
    );
  }

  const view = prepareInvoiceView(input, calc.totals);
  if (view.notesTrimmed) {
    warnings.push(`Notes were trimmed to ${MAX_NOTES} characters.`);
  }
  if (view.termsTrimmed) {
    warnings.push(`Payment terms were trimmed to ${MAX_NOTES} characters.`);
  }
  const title = view.number ? `Invoice ${view.number}` : "Invoice";
  const document = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(title)}</title>
<style>${documentCss(view.accent, view.template)}</style>
</head>
<body>${bodyFor(view)}</body>
</html>`;

  return {
    ok: true,
    totals: calc.totals,
    document,
    warnings,
  };
}

export { TEMPLATE_META };
