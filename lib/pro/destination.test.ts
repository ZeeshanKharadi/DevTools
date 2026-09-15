import { describe, expect, it } from "vitest";
import { sanitizeDestinationUrl } from "./destination";

describe("sanitizeDestinationUrl", () => {
  it("accepts http and https destinations, including localhost", () => {
    expect(sanitizeDestinationUrl("https://example.com/path")).toBe(
      "https://example.com/path",
    );
    expect(sanitizeDestinationUrl("http://localhost:3000/tools")).toContain(
      "http://localhost:3000/tools",
    );
    expect(sanitizeDestinationUrl("example.com")).toBe("https://example.com/");
  });

  it("rejects unsafe schemes", () => {
    expect(sanitizeDestinationUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeDestinationUrl("data:text/html,hi")).toBeNull();
    expect(sanitizeDestinationUrl("file:///etc/passwd")).toBeNull();
    expect(sanitizeDestinationUrl("ftp://example.com")).toBeNull();
  });

  it("rejects credentials and header-injection characters", () => {
    expect(sanitizeDestinationUrl("https://user:pass@example.com")).toBeNull();
    expect(sanitizeDestinationUrl("https://example.com/\r\nSet-Cookie:x=1")).toBeNull();
    expect(sanitizeDestinationUrl("https://example.com/%00")).toBe(
      "https://example.com/%00",
    );
  });
});
