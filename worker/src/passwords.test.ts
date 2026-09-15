import { describe, expect, it } from "vitest";
import {
  PBKDF2_ITERATIONS,
  hashPassword,
  hashPasswordWithIterations,
  verifyPassword,
} from "./passwords";

const password = "correct-horse-battery";

describe("password hashing", () => {
  it("stores algorithm, version, and work factor with a unique salt", async () => {
    const first = await hashPassword(password);
    const second = await hashPassword(password);
    expect(first).not.toBe(second);

    const parts = first.split("$");
    expect(parts).toHaveLength(5);
    expect(parts[0]).toBe("pbkdf2-hmac-sha256");
    expect(parts[1]).toBe("1");
    expect(parts[2]).toBe(String(PBKDF2_ITERATIONS));
    expect(first).not.toContain(password);
  });

  it("verifies with the work factor stored on the hash, not the current default", async () => {
    const stored = await hashPasswordWithIterations(password, 8_192);
    const parts = stored.split("$");
    expect(parts[2]).toBe("8192");
    expect(await verifyPassword(password, stored)).toBe(true);
    expect(await verifyPassword("wrong-password-value", stored)).toBe(false);

    parts[2] = "8193";
    expect(await verifyPassword(password, parts.join("$"))).toBe(false);
  });
});
