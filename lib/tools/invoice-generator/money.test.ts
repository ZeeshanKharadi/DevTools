import { describe, expect, it } from "vitest";
import {
  formatMoney,
  formatQuantity,
  isInvoiceCurrency,
  mulDivRoundHalfUp,
  parseDecimalToScaled,
  parseMoney,
  parsePercentBps,
  parseQuantity,
} from "./money";

describe("currency helpers", () => {
  it("lists the supported codes", () => {
    expect(isInvoiceCurrency("USD")).toBe(true);
    expect(isInvoiceCurrency("JPY")).toBe(true);
    expect(isInvoiceCurrency("BTC")).toBe(false);
  });

  it("parses decimals into scaled integers without floats", () => {
    expect(parseDecimalToScaled("19.99", 2, "Price")).toEqual({
      ok: true,
      value: BigInt(1999),
    });
    expect(parseDecimalToScaled("19.9", 2, "Price")).toEqual({
      ok: true,
      value: BigInt(1990),
    });
    expect(parseDecimalToScaled("100", 0, "Price")).toEqual({
      ok: true,
      value: BigInt(100),
    });
    expect(parseDecimalToScaled("1.5", 0, "Price").ok).toBe(false);
    expect(parseDecimalToScaled("1.999", 2, "Price").ok).toBe(false);
    expect(parseDecimalToScaled("abc", 2, "Price").ok).toBe(false);
  });

  it("parses money, quantity, and percents", () => {
    expect(parseMoney("2400.00", "USD", "Unit").ok).toBe(true);
    expect(parseMoney("99.999", "USD", "Unit").ok).toBe(false);
    expect(parseMoney("150", "JPY", "Unit")).toEqual({
      ok: true,
      value: BigInt(150),
    });
    expect(parseQuantity("1.5")).toEqual({ ok: true, value: BigInt(1500) });
    expect(parseQuantity("0").ok).toBe(false);
    expect(parsePercentBps("8.5", "Tax")).toEqual({
      ok: true,
      value: BigInt(850),
    });
    expect(parsePercentBps("101", "Tax").ok).toBe(false);
  });

  it("rounds half up with integer arithmetic", () => {
    expect(mulDivRoundHalfUp(BigInt(1), BigInt(1), BigInt(2))).toBe(BigInt(1));
    expect(mulDivRoundHalfUp(BigInt(1), BigInt(1), BigInt(3))).toBe(BigInt(0));
    expect(mulDivRoundHalfUp(BigInt(1500), BigInt(1000), BigInt(1000))).toBe(
      BigInt(1500),
    );
    expect(mulDivRoundHalfUp(-BigInt(1), BigInt(1), BigInt(2))).toBe(-BigInt(1));
  });

  it("formats money with the currency's fraction digits", () => {
    expect(formatMoney(BigInt(1999), "USD")).toMatch(/1,999|19\.99|\$/);
    expect(formatMoney(BigInt(150), "JPY")).toMatch(/150|¥|￥|JPY/);
    expect(formatQuantity(BigInt(1500))).toBe("1.5");
  });
});
