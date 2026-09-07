import { MAX_LINE_ITEMS, MAX_TEXT, isDiscountType } from "./constants";
import {
  MAX_ABS_MINOR,
  QTY_DIVISOR,
  PERCENT_BPS_DIVISOR,
  ZERO,
  currencyExponent,
  formatMoney,
  isInvoiceCurrency,
  mulDivRoundHalfUp,
  parseMoney,
  parsePercentBps,
  parseQuantity,
} from "./money";
import { trimField } from "./sanitize";
import type {
  InvoiceCalcResult,
  InvoiceInput,
  InvoiceLineInput,
  InvoiceLineTotals,
  InvoiceTotals,
} from "./types";

function fail(message: string): InvoiceCalcResult {
  return { ok: false, message };
}

function isBlankLine(line: InvoiceLineInput): boolean {
  return (
    !trimField(line.description) &&
    !line.unitPrice.trim() &&
    (line.quantity.trim() === "" || line.quantity.trim() === "1") &&
    (line.taxPercent.trim() === "" || line.taxPercent.trim() === "0")
  );
}

export function calculateInvoice(input: InvoiceInput): InvoiceCalcResult {
  if (!isInvoiceCurrency(input.meta.currency)) {
    return fail("Choose a supported currency.");
  }

  const currency = input.meta.currency;
  const filled = input.lines.filter((line) => !isBlankLine(line));

  if (filled.length === 0) {
    return fail("Add at least one line item.");
  }

  if (filled.length > MAX_LINE_ITEMS) {
    return fail(`Keep invoices to ${MAX_LINE_ITEMS} line items or fewer.`);
  }

  const warnings: string[] = [];
  const lines: InvoiceLineTotals[] = [];

  for (const line of filled) {
    const description = trimField(line.description);

    if (!description) {
      return fail("Each line item needs a description.");
    }

    if (description.length > MAX_TEXT) {
      return fail("Keep line descriptions to 500 characters or fewer.");
    }

    const quantity = parseQuantity(line.quantity);
    if (!quantity.ok) {
      return quantity;
    }

    const unit = parseMoney(line.unitPrice, currency, "Unit price");
    if (!unit.ok) {
      return unit;
    }

    if (unit.value < ZERO) {
      return fail("Unit price cannot be negative.");
    }

    const tax = parsePercentBps(line.taxPercent, "Line tax");
    if (!tax.ok) {
      return tax;
    }

    const netMinor = mulDivRoundHalfUp(quantity.value, unit.value, QTY_DIVISOR);
    const taxMinor = mulDivRoundHalfUp(netMinor, tax.value, PERCENT_BPS_DIVISOR);
    const totalMinor = netMinor + taxMinor;

    if (netMinor > MAX_ABS_MINOR || totalMinor > MAX_ABS_MINOR) {
      return fail("A line total is too large to format safely.");
    }

    lines.push({
      id: line.id,
      description,
      quantityScaled: quantity.value,
      unitMinor: unit.value,
      taxBps: tax.value,
      netMinor,
      taxMinor,
      totalMinor,
    });
  }

  const subtotalMinor = lines.reduce((sum, line) => sum + line.netMinor, ZERO);
  const taxMinor = lines.reduce((sum, line) => sum + line.taxMinor, ZERO);

  const discountType = isDiscountType(input.meta.discountType)
    ? input.meta.discountType
    : "none";

  let discountMinor = ZERO;

  if (discountType === "percent") {
    const percent = parsePercentBps(input.meta.discountValue, "Discount");
    if (!percent.ok) {
      return percent;
    }
    discountMinor = mulDivRoundHalfUp(
      subtotalMinor,
      percent.value,
      PERCENT_BPS_DIVISOR,
    );
  } else if (discountType === "amount") {
    const amount = parseMoney(input.meta.discountValue, currency, "Discount");
    if (!amount.ok) {
      return amount;
    }
    if (amount.value < ZERO) {
      return fail("Discount cannot be negative.");
    }
    discountMinor = amount.value;
  }

  if (discountMinor > subtotalMinor) {
    discountMinor = subtotalMinor;
    warnings.push("The discount was limited to the subtotal.");
  }

  const totalMinor = subtotalMinor - discountMinor + taxMinor;

  const paidRaw = input.meta.amountPaid.trim() === "" ? "0" : input.meta.amountPaid;
  const paid = parseMoney(paidRaw, currency, "Amount paid");
  if (!paid.ok) {
    return paid;
  }
  if (paid.value < ZERO) {
    return fail("Amount paid cannot be negative.");
  }

  const unpaid = totalMinor - paid.value;
  const balanceMinor = unpaid > ZERO ? unpaid : ZERO;
  const creditMinor = unpaid < ZERO ? -unpaid : ZERO;

  if (creditMinor > ZERO) {
    warnings.push(
      `Amount paid is ${formatMoney(creditMinor, currency)} more than the total.`,
    );
  }

  if (currencyExponent(currency) === 0 && lines.some((line) => line.unitMinor === ZERO)) {
    warnings.push("A line has a zero unit price.");
  }

  const totals: InvoiceTotals = {
    currency,
    exponent: currencyExponent(currency),
    lines,
    subtotalMinor,
    discountMinor,
    taxMinor,
    totalMinor,
    paidMinor: paid.value,
    balanceMinor,
    creditMinor,
  };

  return { ok: true, totals, warnings };
}
