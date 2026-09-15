import { describe, expect, it } from "vitest";
import { EXAMPLE_INPUT, EMPTY_INPUT } from "./constants";
import { prepareCard, splitName } from "./prepare";
import { buildDownloadVCard, contactPlainText, qrPayloadForCard } from "./vcard";

describe("splitName / prepareCard", () => {
  it("splits a full name for vCard N/FN", () => {
    expect(splitName("Jane Rivera")).toEqual({
      given: "Jane",
      family: "Rivera",
    });
    expect(splitName("Prince")).toEqual({ given: "Prince", family: "" });
  });

  it("omits javascript URLs and invalid emails", () => {
    const prepared = prepareCard({
      ...EXAMPLE_INPUT,
      fields: {
        ...EXAMPLE_INPUT.fields,
        email: "not-an-email",
        website: "javascript:alert(1)",
        linkedin: "javascript:alert(1)",
      },
    });
    expect(prepared.email).toBeNull();
    expect(prepared.websiteHref).toBeNull();
    expect(prepared.socials.some((social) => social.id === "linkedin")).toBe(
      false,
    );
    expect(prepared.warnings.length).toBeGreaterThan(0);
  });

  it("accepts hosted https images for public cards", () => {
    const prepared = prepareCard({
      ...EXAMPLE_INPUT,
      photoDataUrl: "https://cdn.example.com/photo.png",
      logoDataUrl: "https://cdn.example.com/logo.png",
    });
    expect(prepared.photoSrc).toBe("https://cdn.example.com/photo.png");
    expect(prepared.logoSrc).toBe("https://cdn.example.com/logo.png");
  });
});

describe("vCard and QR payload", () => {
  it("builds a vCard 3.0 file from prepared fields", () => {
    const result = buildDownloadVCard(EXAMPLE_INPUT);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.vcard.startsWith("BEGIN:VCARD\r\nVERSION:3.0")).toBe(true);
    expect(result.vcard).toContain("FN:Jane Rivera");
    expect(result.vcard).toContain("N:Rivera;Jane;;;");
    expect(result.vcard).toContain("ORG:Northwind Labs");
    expect(result.vcard).toContain("EMAIL;TYPE=INTERNET:jane@northwindlabs.example");
    expect(result.vcard).toContain("X-SOCIALPROFILE;TYPE=linkedin:");
    expect(result.vcard).toContain("END:VCARD");
  });

  it("escapes vCard special characters and does not execute HTML", () => {
    const result = buildDownloadVCard({
      ...EXAMPLE_INPUT,
      fields: {
        ...EXAMPLE_INPUT.fields,
        fullName: "Ada Lovelace",
        company: "Acme; Inc",
        bio: `<script>alert(1)</script>`,
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.vcard).toContain("ORG:Acme\\; Inc");
      expect(result.vcard).toContain("NOTE:<script>alert(1)</script>");
    }
  });

  it("reuses the QR vCard encoder for a scannable contact payload", () => {
    const payload = qrPayloadForCard(EXAMPLE_INPUT);
    expect(payload.ok).toBe(true);
    if (payload.ok) {
      expect(payload.payload).toContain("BEGIN:VCARD");
      expect(payload.payload).toContain("FN:Jane Rivera");
      expect(payload.payload).not.toContain("X-SOCIALPROFILE");
    }
  });

  it("requires a name and copies a plain-text contact block", () => {
    expect(buildDownloadVCard(EMPTY_INPUT).ok).toBe(false);
    const prepared = prepareCard(EXAMPLE_INPUT);
    expect(contactPlainText(prepared)).toContain("Jane Rivera");
    expect(contactPlainText(prepared)).toContain("jane@northwindlabs.example");
  });
});
