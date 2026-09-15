import { describe, expect, it } from "vitest";
import { EXAMPLE_INPUT } from "./constants";
import { parseStoredSignatureInput } from "./stored";

describe("parseStoredSignatureInput", () => {
  it("keeps hosted images and structured fields", () => {
    const result = parseStoredSignatureInput({
      ...EXAMPLE_INPUT,
      photo: { origin: "hosted", url: "https://cdn.example.com/photo.png" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.photo.origin).toBe("hosted");
      expect(result.data.fields.fullName).toBe("Jane Rivera");
    }
  });

  it("strips local data-URL images instead of persisting them", () => {
    const result = parseStoredSignatureInput({
      ...EXAMPLE_INPUT,
      photo: { origin: "local", url: "data:image/png;base64,aaaa" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.photo.origin).toBe("none");
      expect(result.warnings.length).toBeGreaterThan(0);
    }
  });
});
