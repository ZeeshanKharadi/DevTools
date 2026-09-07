import { calculateInvoice } from "./calculate";
import { DEFAULT_ACCENT } from "./constants";
import { ZERO, formatMoney, formatPercent, formatQuantity } from "./money";
import { prepareInvoiceView } from "./render";
import { sanitizeColor, sanitizeDataImageUrl } from "./sanitize";
import type { InvoiceInput } from "./types";

type JsPdfDoc = {
  setFont: (face: string, style?: string) => void;
  setFontSize: (size: number) => void;
  setTextColor: (r: number, g: number, b: number) => void;
  setDrawColor: (r: number, g: number, b: number) => void;
  setFillColor: (r: number, g: number, b: number) => void;
  text: (text: string | string[], x: number, y: number, options?: { align?: string }) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  rect: (x: number, y: number, w: number, h: number, style?: string) => void;
  addImage: (
    image: string,
    format: string,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => void;
  splitTextToSize: (text: string, size: number) => string[];
  save: (filename: string) => void;
  addPage: () => void;
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
};

const PAGE_BOTTOM = 280;
const PAGE_START = 18;

function hexToRgb(hex: string): { r: number, g: number, b: number } {
  const value = hex.replace("#", "");
  const n = Number.parseInt(value, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function logoFormat(dataUrl: string): "PNG" | "JPEG" | null {
  if (dataUrl.startsWith("data:image/png")) {
    return "PNG";
  }
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) {
    return "JPEG";
  }
  return null;
}

export async function downloadInvoicePdf(
  input: InvoiceInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const calc = calculateInvoice(input);
  if (!calc.ok) {
    return calc;
  }

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" }) as unknown as JsPdfDoc;
  const view = prepareInvoiceView(input, calc.totals);
  const accent = hexToRgb(sanitizeColor(view.accent, DEFAULT_ACCENT));
  const width = doc.internal.pageSize.getWidth();
  const wrapWidth = width - 32;
  let y = PAGE_START;

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_BOTTOM) {
      doc.addPage();
      y = PAGE_START;
    }
  };

  const writeWrapped = (text: string, x: number, maxWidth: number, options?: { align?: string }) => {
    const lines = text
      .split("\n")
      .flatMap((paragraph) => doc.splitTextToSize(paragraph || " ", maxWidth));
    ensureSpace(Math.max(lines.length * 5, 5));
    doc.text(lines, x, y, options);
    y += lines.length * 5;
    return lines;
  };

  const logo = view.logoSrc ? sanitizeDataImageUrl(view.logoSrc) : null;
  const format = logo ? logoFormat(logo) : null;
  if (logo && format) {
    try {
      doc.addImage(logo, format, 16, y, 28, 14);
    } catch {
      // Logo encoding is optional in PDF.
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text("INVOICE", width - 16, y + 8, { align: "right" });
  y += 22;

  doc.setTextColor(27, 25, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  writeWrapped(view.seller.company || view.seller.name || "Seller", 16, 90);
  doc.setFont("helvetica", "normal");
  const sellerLines = [
    view.seller.name,
    view.seller.address,
    view.seller.email,
    view.seller.phone,
    view.seller.taxId,
  ].filter(Boolean);

  const meta = [
    view.number ? `Invoice ${view.number}` : "",
    view.issueDate ? `Issued ${view.issueDate}` : "",
    view.dueDate ? `Due ${view.dueDate}` : "",
    view.poNumber ? `PO ${view.poNumber}` : "",
    `Currency ${view.currency}`,
  ].filter(Boolean);

  const sellerStart = y;
  sellerLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, 90);
    doc.text(wrapped, 16, y);
    y += wrapped.length * 5;
  });
  const sellerEnd = y;

  y = sellerStart;
  meta.forEach((line) => {
    doc.text(line, width - 16, y, { align: "right" });
    y += 5;
  });
  y = Math.max(sellerEnd, y) + 8;

  ensureSpace(20);
  doc.setFont("helvetica", "bold");
  doc.text("Bill to", 16, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  const bill = [
    view.customer.company,
    view.customer.name,
    view.customer.address,
    view.customer.email,
    view.customer.phone,
  ].filter(Boolean);
  bill.forEach((line) => {
    writeWrapped(line, 16, 90);
  });
  y += 8;

  ensureSpace(16);
  doc.setDrawColor(accent.r, accent.g, accent.b);
  doc.line(16, y, width - 16, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Description", 16, y);
  doc.text("Qty", 118, y, { align: "right" });
  doc.text("Unit", 142, y, { align: "right" });
  doc.text("Tax", 162, y, { align: "right" });
  doc.text("Amount", width - 16, y, { align: "right" });
  y += 6;
  doc.setFont("helvetica", "normal");

  for (const line of calc.totals.lines) {
    const wrapped = doc.splitTextToSize(line.description, 90);
    const block = Math.max(wrapped.length * 5, 6) + 2;
    ensureSpace(block);
    doc.text(wrapped, 16, y);
    doc.text(formatQuantity(line.quantityScaled), 118, y, { align: "right" });
    doc.text(formatMoney(line.unitMinor, calc.totals.currency), 142, y, { align: "right" });
    doc.text(formatPercent(line.taxBps), 162, y, { align: "right" });
    doc.text(formatMoney(line.netMinor, calc.totals.currency), width - 16, y, { align: "right" });
    y += block;
  }

  ensureSpace(48);
  y += 4;
  doc.setDrawColor(217, 210, 196);
  doc.line(120, y, width - 16, y);
  y += 8;
  const summary: [string, string, boolean?][] = [
    ["Subtotal", formatMoney(calc.totals.subtotalMinor, calc.totals.currency)],
  ];
  if (calc.totals.discountMinor > ZERO) {
    summary.push(["Discount", `-${formatMoney(calc.totals.discountMinor, calc.totals.currency)}`]);
  }
  summary.push(["Tax", formatMoney(calc.totals.taxMinor, calc.totals.currency)]);
  summary.push(["Total", formatMoney(calc.totals.totalMinor, calc.totals.currency), true]);
  summary.push(["Amount paid", formatMoney(calc.totals.paidMinor, calc.totals.currency)]);
  summary.push(["Balance due", formatMoney(calc.totals.balanceMinor, calc.totals.currency), true]);

  for (const [label, value, emphasize] of summary) {
    ensureSpace(8);
    if (emphasize) {
      doc.setFont("helvetica", "bold");
    }
    doc.text(label, 122, y);
    doc.text(value, width - 16, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 6;
  }

  y += 8;
  if (view.notes) {
    ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.text("Notes", 16, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    writeWrapped(view.notes, 16, wrapWidth);
    y += 6;
  }
  if (view.terms) {
    ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.text("Payment terms", 16, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    writeWrapped(view.terms, 16, wrapWidth);
  }

  const filename = `${(view.number || "invoice").replace(/[^\w.-]+/g, "-")}.pdf`;
  doc.save(filename);
  return { ok: true };
}
