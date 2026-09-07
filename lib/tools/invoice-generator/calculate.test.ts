import { describe, expect, it } from "vitest";
import { calculateInvoice } from "./calculate";
import { EXAMPLE_INPUT, MAX_NOTES, emptyLine } from "./constants";
import { escapeHtml, sanitizeEmail, sanitizeHttpUrl, trimMultiline } from "./sanitize";
import { renderInvoice } from "./render";
import type { InvoiceInput } from "./types";

function invoice(overrides: Partial<InvoiceInput> = {}): InvoiceInput {
  return {
    ...EXAMPLE_INPUT,
    ...overrides,
    seller: { ...EXAMPLE_INPUT.seller, ...overrides.seller },
    customer: { ...EXAMPLE_INPUT.customer, ...overrides.customer },
    meta: { ...EXAMPLE_INPUT.meta, ...overrides.meta },
    lines: overrides.lines ?? EXAMPLE_INPUT.lines,
    options: { ...EXAMPLE_INPUT.options, ...overrides.options },
  };
}

describe("calculateInvoice", () => {
  it("computes the example invoice with per-line tax and a percent discount", () => {
    const result = calculateInvoice(EXAMPLE_INPUT);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    // 1 * 240000 + 2 * 15000 = 270000 cents subtotal
    expect(result.totals.subtotalMinor).toBe(BigInt(270000));
    // 8.5% of 240000 = 20400; second line 0
    expect(result.totals.taxMinor).toBe(BigInt(20400));
    // 5% of 270000 = 13500
    expect(result.totals.discountMinor).toBe(BigInt(13500));
    // 270000 - 13500 + 20400 = 276900
    expect(result.totals.totalMinor).toBe(BigInt(276900));
    expect(result.totals.balanceMinor).toBe(BigInt(276900));
  });

  it("uses half-up rounding on fractional cents", () => {
    const result = calculateInvoice(
      invoice({
        meta: {
          ...EXAMPLE_INPUT.meta,
          discountType: "none",
          discountValue: "",
          amountPaid: "0",
        },
        lines: [
          {
            id: "a",
            description: "Odd rate",
            quantity: "1",
            unitPrice: "1.00",
            taxPercent: "8.5",
          },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.totals.taxMinor).toBe(BigInt(9));
    }
  });

  it("formats JPY without minor units", () => {
    const result = calculateInvoice(
      invoice({
        meta: {
          ...EXAMPLE_INPUT.meta,
          currency: "JPY",
          discountType: "none",
          amountPaid: "0",
        },
        lines: [
          {
            id: "a",
            description: "Workshop",
            quantity: "2",
            unitPrice: "1500",
            taxPercent: "10",
          },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.totals.subtotalMinor).toBe(BigInt(3000));
      expect(result.totals.taxMinor).toBe(BigInt(300));
      expect(result.totals.totalMinor).toBe(BigInt(3300));
    }
  });

  it("caps discount at the subtotal and treats overpayment as credit", () => {
    const capped = calculateInvoice(
      invoice({
        meta: {
          ...EXAMPLE_INPUT.meta,
          discountType: "amount",
          discountValue: "99999.00",
        },
      }),
    );
    expect(capped.ok).toBe(true);
    if (capped.ok) {
      expect(capped.totals.discountMinor).toBe(capped.totals.subtotalMinor);
      expect(capped.warnings.some((warning) => /limited/i.test(warning))).toBe(
        true,
      );
    }

    const paid = calculateInvoice(
      invoice({
        meta: { ...EXAMPLE_INPUT.meta, amountPaid: "5000.00" },
      }),
    );
    expect(paid.ok).toBe(true);
    if (paid.ok) {
      expect(paid.totals.balanceMinor).toBe(BigInt(0));
      expect(paid.totals.creditMinor).toBeGreaterThan(BigInt(0));
    }
  });

  it("rejects invalid lines, quantities, and currencies", () => {
    expect(calculateInvoice(invoice({ lines: [] })).ok).toBe(false);
    expect(
      calculateInvoice(
        invoice({
          lines: [
            {
              id: "a",
              description: "X",
              quantity: "0",
              unitPrice: "1",
              taxPercent: "0",
            },
          ],
        }),
      ).ok,
    ).toBe(false);
    expect(
      calculateInvoice(
        invoice({
          meta: { ...EXAMPLE_INPUT.meta, currency: "USD" },
          lines: [emptyLine("z")],
        }),
      ).ok,
    ).toBe(false);
  });
});

describe("renderInvoice", () => {
  it("renders a standalone invoice document without app chrome", () => {
    const result = renderInvoice(EXAMPLE_INPUT);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.document.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(result.document).toContain("INVOICE");
    expect(result.document).toContain("INV-1042");
    expect(result.document).toContain("Northwind Labs");
    expect(result.document).toContain("Contoso Studio");
    expect(result.document).not.toContain("DevTools");
    expect(result.document).not.toContain("InfyraTools");
    expect(result.document).not.toContain("Download PDF");
    expect(result.document).not.toContain("nav");
  });

  it("varies markup across the three templates", () => {
    const classic = renderInvoice(EXAMPLE_INPUT);
    const modern = renderInvoice(
      invoice({
        options: { ...EXAMPLE_INPUT.options, template: "modern" },
      }),
    );
    const compact = renderInvoice(
      invoice({
        options: { ...EXAMPLE_INPUT.options, template: "compact" },
      }),
    );

    expect(classic.ok && modern.ok && compact.ok).toBe(true);
    if (!classic.ok || !modern.ok || !compact.ok) {
      return;
    }

    expect(modern.document).toContain('class="hero"');
    expect(classic.document).not.toContain('class="hero"');
    expect(compact.document).toContain("Invoice INV-1042");
    expect(compact.document).toContain("<h1>Northwind Labs</h1>");
  });

  it("escapes HTML in descriptions and omits javascript URLs", () => {
    const result = renderInvoice(
      invoice({
        lines: [
          {
            id: "a",
            description: `<script>alert(1)</script>`,
            quantity: "1",
            unitPrice: "10.00",
            taxPercent: "0",
          },
        ],
        seller: {
          ...EXAMPLE_INPUT.seller,
          website: "javascript:alert(1)",
        },
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document).toContain(escapeHtml(`<script>alert(1)</script>`));
      expect(result.document).not.toContain("javascript:alert(1)");
      expect(result.warnings.some((warning) => /website/i.test(warning))).toBe(
        true,
      );
    }
  });

  it("rejects unsafe emails", () => {
    expect(sanitizeEmail("not-an-email")).toBeNull();
    expect(sanitizeHttpUrl("javascript:alert(1)")).toBeNull();
  });

  it("keeps line breaks in notes and trims very long notes", () => {
    expect(trimMultiline("Pay by\n\nwire transfer")).toBe("Pay by\n\nwire transfer");
    expect(trimMultiline("Pay   by\n wire")).toBe("Pay by\n wire");

    const result = renderInvoice(
      invoice({
        meta: {
          ...EXAMPLE_INPUT.meta,
          notes: `Line one\nLine two\n${"x".repeat(MAX_NOTES)}`,
        },
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document).toContain("Line one\nLine two");
      expect(result.warnings.some((warning) => /Notes were trimmed/i.test(warning))).toBe(
        true,
      );
    }
  });
});
