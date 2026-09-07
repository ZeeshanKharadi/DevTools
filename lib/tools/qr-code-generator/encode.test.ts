import { describe, expect, it } from "vitest";
import {
  DEFAULT_STYLE,
  EMPTY_FIELDS,
  EXAMPLE_INPUT,
  QR_GENERATION_MODE,
  effectiveErrorCorrection,
  overlayLogoOnSvg,
  renderStaticQr,
  type QrFields,
  type QrInput,
  type QrStyle,
} from "./index";

const PNG_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function input(overrides: {
  type?: QrInput["type"];
  fields?: Partial<QrFields>;
  style?: Partial<QrStyle>;
  logoDataUrl?: string | null;
} = {}): QrInput {
  return {
    type: overrides.type ?? EXAMPLE_INPUT.type,
    fields: { ...EMPTY_FIELDS, ...EXAMPLE_INPUT.fields, ...overrides.fields },
    style: { ...DEFAULT_STYLE, ...overrides.style },
    logoDataUrl: overrides.logoDataUrl ?? null,
  };
}

describe("renderStaticQr", () => {
  it("renders PNG and SVG for a URL payload", async () => {
    const result = await renderStaticQr(EXAMPLE_INPUT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mode).toBe(QR_GENERATION_MODE);
      expect(result.payload).toBe("https://example.com/");
      expect(result.pngDataUrl.startsWith("data:image/png;base64,")).toBe(true);
      expect(result.svg).toContain("<svg");
      expect(result.svg).toContain("</svg>");
      expect(result.errorCorrection).toBe("M");
    }
  });

  it("returns a validation error without calling the encoder", async () => {
    const result = await renderStaticQr(input({ fields: { url: "" } }));
    expect(result).toMatchObject({
      ok: false,
      message: expect.stringMatching(/url/i),
    });
  });

  it("honors error correction and forces H when a logo is present", async () => {
    expect(effectiveErrorCorrection(DEFAULT_STYLE, false)).toBe("M");
    expect(
      effectiveErrorCorrection({ ...DEFAULT_STYLE, errorCorrection: "L" }, true),
    ).toBe("H");

    const withLogo = await renderStaticQr(
      input({
        style: { ...DEFAULT_STYLE, errorCorrection: "L" },
        logoDataUrl: PNG_PIXEL,
      }),
    );
    expect(withLogo.ok).toBe(true);
    if (withLogo.ok) {
      expect(withLogo.errorCorrection).toBe("H");
      expect(withLogo.svg).toContain("<image href=");
      expect(withLogo.warnings.some((warning) => /level H/i.test(warning))).toBe(
        true,
      );
    }
  });

  it("rejects unsafe logo sources", async () => {
    const result = await renderStaticQr(
      input({ logoDataUrl: "javascript:alert(1)" }),
    );
    expect(result.ok).toBe(false);
  });
});

describe("overlayLogoOnSvg", () => {
  it("injects a centered image without executing the logo payload", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>';
    const result = overlayLogoOnSvg(svg, PNG_PIXEL);
    expect(result).toContain(`href="${PNG_PIXEL}"`);
    expect(result).toContain("<rect ");
    expect(result.endsWith("</svg>")).toBe(true);
  });
});
