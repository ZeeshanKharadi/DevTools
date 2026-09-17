import { describe, expect, it } from "vitest";
import {
  generateOtp,
  hashOtp,
  normalizeOtp,
  OTP_DIGITS,
  verifyOtp,
} from "./otp";

describe("OTP hashing", () => {
  it("generates 6-digit codes and stores HMAC hashes, not plaintext", async () => {
    const otp = generateOtp();
    expect(otp).toMatch(new RegExp(`^[0-9]{${OTP_DIGITS}}$`));

    const first = await hashOtp(otp);
    const second = await hashOtp(otp);
    expect(first).not.toBe(second);
    expect(first).not.toContain(otp);
    expect(first.startsWith("hmac-sha256$1$")).toBe(true);
    expect(await verifyOtp(otp, first)).toBe(true);
    expect(await verifyOtp("000000", first)).toBe(false);
  });

  it("normalizes spacing and rejects non-digit codes", () => {
    expect(normalizeOtp("123 456")).toBe("123456");
    expect(normalizeOtp("12a456")).toBeNull();
    expect(normalizeOtp("12345")).toBeNull();
    expect(normalizeOtp(123456)).toBeNull();
  });
});
