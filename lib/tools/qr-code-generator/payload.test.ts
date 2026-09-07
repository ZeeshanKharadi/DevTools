import { describe, expect, it } from "vitest";
import {
  EMPTY_FIELDS,
  MAX_SSID_CHARS,
  MAX_TEXT_CHARS,
  QR_GENERATION_MODE,
  QR_PRO_FEATURES,
  QR_TYPES,
  buildQrPayload,
  colorWarnings,
  contrastRatio,
  escapeVCardValue,
  escapeWifiValue,
  foldVCardLine,
  isQrType,
  sanitizeColor,
  sanitizeDataImageUrl,
  sanitizeEmail,
  sanitizeHttpUrl,
  sanitizePhone,
  sanitizeQrMargin,
  sanitizeQrSize,
  telDigits,
  type QrFields,
} from "./index";

function fields(overrides: Partial<QrFields> = {}): QrFields {
  return { ...EMPTY_FIELDS, ...overrides };
}

describe("supported QR types", () => {
  it("lists the seven static payload types", () => {
    expect([...QR_TYPES]).toEqual([
      "url",
      "text",
      "email",
      "phone",
      "sms",
      "wifi",
      "vcard",
    ]);
    expect(QR_TYPES.every(isQrType)).toBe(true);
    expect(isQrType("dynamic")).toBe(false);
    expect(QR_GENERATION_MODE).toBe("static");
  });

  it("keeps future Pro features out of the static generator", () => {
    expect(QR_PRO_FEATURES).toEqual([
      "dynamic-qr",
      "editable-destinations",
      "scan-analytics",
      "saved-qr-codes",
      "custom-domains",
      "bulk-generation",
      "premium-designs",
      "hosted-short-urls",
    ]);
  });
});

describe("URL payloads", () => {
  it("accepts https URLs and adds https when the scheme is missing", () => {
    const https = buildQrPayload("url", fields({ url: "https://example.com/path" }));
    expect(https).toMatchObject({ ok: true, payload: "https://example.com/path" });

    const implied = buildQrPayload("url", fields({ url: "example.com" }));
    expect(implied.ok).toBe(true);
    if (implied.ok) {
      expect(implied.payload).toBe("https://example.com/");
    }
  });

  it("rejects javascript, data, blob, and credentialed URLs", () => {
    expect(sanitizeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeHttpUrl("data:text/html,hi")).toBeNull();
    expect(sanitizeHttpUrl("blob:https://example.com/1")).toBeNull();
    expect(sanitizeHttpUrl("https://user:pass@example.com")).toBeNull();
    expect(buildQrPayload("url", fields({ url: "javascript:alert(1)" })).ok).toBe(
      false,
    );
  });
});

describe("plain text payloads", () => {
  it("encodes text literally and does not execute it", () => {
    const result = buildQrPayload(
      "text",
      fields({ text: `<script>alert("x")</script>` }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload).toBe(`<script>alert("x")</script>`);
    }
  });

  it("rejects empty and oversized text", () => {
    expect(buildQrPayload("text", fields({ text: "   " })).ok).toBe(false);
    expect(
      buildQrPayload("text", fields({ text: "a".repeat(MAX_TEXT_CHARS + 1) })).ok,
    ).toBe(false);
    expect(
      buildQrPayload("text", fields({ text: "a".repeat(MAX_TEXT_CHARS) })).ok,
    ).toBe(true);
  });
});

describe("email payloads", () => {
  it("builds mailto URIs with encoded subject and body", () => {
    const result = buildQrPayload(
      "email",
      fields({
        email: "jane@example.com",
        emailSubject: "Hello there",
        emailBody: "Line 1&2",
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.startsWith("mailto:jane@example.com?")).toBe(true);
      expect(result.payload).toContain("subject=Hello+there");
      expect(result.payload).toContain("body=Line+1%262");
    }
  });

  it("rejects invalid addresses and omits empty query params", () => {
    expect(sanitizeEmail("not-an-email")).toBeNull();
    expect(sanitizeEmail(`a<script>@x.com`)).toBeNull();
    const result = buildQrPayload("email", fields({ email: "jane@example.com" }));
    expect(result).toMatchObject({ ok: true, payload: "mailto:jane@example.com" });
  });
});

describe("phone and SMS payloads", () => {
  it("builds tel URIs from sanitized digits", () => {
    expect(sanitizePhone("+1 415 555 0198")).toBe("+1 415 555 0198");
    expect(telDigits("+1 415 555 0198")).toBe("+14155550198");
    expect(sanitizePhone("abc")).toBeNull();
    const result = buildQrPayload("phone", fields({ phone: "+1 415 555 0198" }));
    expect(result).toMatchObject({ ok: true, payload: "tel:+14155550198" });
  });

  it("builds sms URIs and percent-encodes the body", () => {
    const emptyBody = buildQrPayload("sms", fields({ smsPhone: "+14155550198" }));
    expect(emptyBody).toMatchObject({ ok: true, payload: "sms:+14155550198" });

    const withBody = buildQrPayload(
      "sms",
      fields({ smsPhone: "+14155550198", smsBody: "Hello & hi" }),
    );
    expect(withBody.ok).toBe(true);
    if (withBody.ok) {
      expect(withBody.payload).toBe("sms:+14155550198?body=Hello%20%26%20hi");
    }
  });
});

describe("Wi-Fi payloads", () => {
  it("escapes SSID and password special characters", () => {
    expect(escapeWifiValue(`net;work:1, "x"\\`)).toBe(
      `net\\;work\\:1\\, \\"x\\"\\\\`,
    );

    const result = buildQrPayload(
      "wifi",
      fields({
        wifiSsid: "Cafe;WiFi",
        wifiPassword: "p:a,ss;w\\ord",
        wifiAuth: "WPA",
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload).toBe(
        "WIFI:T:WPA;S:Cafe\\;WiFi;P:p\\:a\\,ss\\;w\\\\ord;;",
      );
    }
  });

  it("supports open networks, hidden networks, and rejects empty SSIDs", () => {
    const open = buildQrPayload(
      "wifi",
      fields({ wifiSsid: "Guest", wifiAuth: "nopass" }),
    );
    expect(open).toMatchObject({ ok: true, payload: "WIFI:T:nopass;S:Guest;;" });

    const hidden = buildQrPayload(
      "wifi",
      fields({
        wifiSsid: "Secret",
        wifiPassword: "hunter2",
        wifiAuth: "WPA",
        wifiHidden: true,
      }),
    );
    expect(hidden.ok).toBe(true);
    if (hidden.ok) {
      expect(hidden.payload).toBe("WIFI:T:WPA;S:Secret;P:hunter2;H:true;;");
    }

    expect(buildQrPayload("wifi", fields({ wifiSsid: "" })).ok).toBe(false);
    expect(
      buildQrPayload(
        "wifi",
        fields({ wifiSsid: "x".repeat(MAX_SSID_CHARS + 1), wifiPassword: "a" }),
      ).ok,
    ).toBe(false);
    expect(
      buildQrPayload(
        "wifi",
        fields({ wifiSsid: "Net", wifiAuth: "nopass", wifiPassword: "nope" }),
      ).ok,
    ).toBe(false);
  });
});

describe("vCard payloads", () => {
  it("builds a vCard 3.0 document from fields, not raw user vCard text", () => {
    const result = buildQrPayload(
      "vcard",
      fields({
        vcardFirstName: "Jane",
        vcardLastName: "Doe",
        vcardOrganization: "Northwind",
        vcardTitle: "Editor",
        vcardPhone: "+1 415 555 0198",
        vcardEmail: "jane@example.com",
        vcardWebsite: "https://example.com",
        vcardStreet: "1 Main St",
        vcardCity: "Springfield",
        vcardRegion: "CA",
        vcardPostalCode: "94000",
        vcardCountry: "US",
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n")).toBe(
        true,
      );
      expect(result.payload).toContain("N:Doe;Jane;;;");
      expect(result.payload).toContain("FN:Jane Doe");
      expect(result.payload).toContain("ORG:Northwind");
      expect(result.payload).toContain("TITLE:Editor");
      expect(result.payload).toContain("TEL;TYPE=VOICE:+14155550198");
      expect(result.payload).toContain("EMAIL;TYPE=INTERNET:jane@example.com");
      expect(result.payload).toContain("URL:https://example.com/");
      expect(result.payload).toContain(
        "ADR;TYPE=WORK:;;1 Main St;Springfield;CA;94000;US",
      );
      expect(result.payload.endsWith("END:VCARD")).toBe(true);
    }
  });

  it("escapes vCard special characters and does not execute HTML", () => {
    expect(escapeVCardValue(`Doe; Jr, \\x`)).toBe(`Doe\\; Jr\\, \\\\x`);
    const result = buildQrPayload(
      "vcard",
      fields({
        vcardFirstName: `<script>alert(1)</script>`,
        vcardLastName: "O'Neil;Hack",
        vcardOrganization: "Acme, Inc",
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload).toContain("N:O'Neil\\;Hack;<script>alert(1)</script>;;;");
      expect(result.payload).toContain("ORG:Acme\\, Inc");
      expect(result.payload).not.toContain("BEGIN:VCARD\nN:");
    }
  });

  it("requires a name and validates optional contact fields", () => {
    expect(buildQrPayload("vcard", fields()).ok).toBe(false);
    expect(
      buildQrPayload("vcard", fields({ vcardFirstName: "Jane", vcardEmail: "nope" }))
        .ok,
    ).toBe(false);
    expect(
      buildQrPayload(
        "vcard",
        fields({ vcardFirstName: "Jane", vcardWebsite: "javascript:alert(1)" }),
      ).ok,
    ).toBe(false);
    expect(buildQrPayload("vcard", fields({ vcardFirstName: "Jane" })).ok).toBe(
      true,
    );
  });

  it("folds long vCard lines", () => {
    const long = "A".repeat(90);
    const folded = foldVCardLine(`ORG:${long}`);
    expect(folded.startsWith("ORG:")).toBe(true);
    expect(folded).toContain("\r\n ");
    expect(folded.split("\r\n").every((line) => line.length <= 75)).toBe(true);
  });
});

describe("validation helpers", () => {
  it("clamps size and margin", () => {
    expect(sanitizeQrSize(64)).toBe(128);
    expect(sanitizeQrSize(2000)).toBe(1024);
    expect(sanitizeQrSize(280)).toBe(280);
    expect(sanitizeQrMargin(-1)).toBe(0);
    expect(sanitizeQrMargin(20)).toBe(8);
  });

  it("normalizes colors and flags low contrast", () => {
    expect(sanitizeColor("#0F6", "#000000")).toBe("#00ff66");
    expect(sanitizeColor("red", "#1b1914")).toBe("#1b1914");
    expect(contrastRatio("#000000", "#ffffff")).toBeGreaterThan(10);
    expect(colorWarnings("#ffffff", "#ffffff")[0]).toMatch(/differ/i);
    expect(colorWarnings("#fefefe", "#ffffff")[0]).toMatch(/similar/i);
  });

  it("accepts raster data URLs and rejects other image sources", () => {
    const png =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    expect(sanitizeDataImageUrl(png)).toBe(png);
    expect(sanitizeDataImageUrl("blob:https://example.com/uuid")).toBeNull();
    expect(sanitizeDataImageUrl("https://example.com/logo.png")).toBeNull();
  });

  it("rejects unknown types and oversized payloads", () => {
    expect(buildQrPayload("dynamic", fields({ text: "x" })).ok).toBe(false);
    const huge = buildQrPayload(
      "text",
      fields({ text: "é".repeat(MAX_TEXT_CHARS) }),
    );
    expect(huge.ok).toBe(false);
  });
});
