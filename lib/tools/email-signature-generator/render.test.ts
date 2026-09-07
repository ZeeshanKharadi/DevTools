import { describe, expect, it } from "vitest";
import {
  EMPTY_INPUT,
  EXAMPLE_INPUT,
  SIGNATURE_TEMPLATES,
  escapeHtml,
  prepareSignature,
  renderSignature,
  sanitizeEmail,
  sanitizeHttpUrl,
  sanitizeImageSrc,
  sanitizePhone,
} from "./index";
import type { SignatureInput, SignatureTemplateId } from "./types";

function withFields(
  overrides: Partial<SignatureInput["fields"]>,
  extra: Partial<SignatureInput> = {},
): SignatureInput {
  return {
    ...EXAMPLE_INPUT,
    ...extra,
    fields: { ...EXAMPLE_INPUT.fields, ...overrides },
    options: extra.options
      ? { ...EXAMPLE_INPUT.options, ...extra.options }
      : EXAMPLE_INPUT.options,
  };
}

describe("escapeHtml / sanitization", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("rejects javascript and data URLs", () => {
    expect(sanitizeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeHttpUrl("data:text/html,<h1>x</h1>")).toBeNull();
    expect(sanitizeHttpUrl("blob:https://example.com/1")).toBeNull();
    expect(sanitizeHttpUrl("vbscript:msgbox(1)")).toBeNull();
  });

  it("allows http(s) and adds https when missing", () => {
    expect(sanitizeHttpUrl("https://example.com/in")).toBe(
      "https://example.com/in",
    );
    expect(sanitizeHttpUrl("example.com")).toBe("https://example.com/");
  });

  it("rejects emails that are not addresses", () => {
    expect(sanitizeEmail("not-an-email")).toBeNull();
    expect(sanitizeEmail("a<script>@x.com")).toBeNull();
    expect(sanitizeEmail("jane@northwindlabs.example")).toBe(
      "jane@northwindlabs.example",
    );
  });

  it("accepts phone numbers and builds tel links", () => {
    expect(sanitizePhone("+1 415 555 0198")).toBe("+1 415 555 0198");
    expect(sanitizePhone("abc")).toBeNull();
  });

  it("allows https images and png data URLs, not blob URLs", () => {
    expect(sanitizeImageSrc("https://cdn.example.com/photo.png")).toBe(
      "https://cdn.example.com/photo.png",
    );
    expect(
      sanitizeImageSrc(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      ),
    ).toMatch(/^data:image\/png;base64,/);
    expect(sanitizeImageSrc("blob:https://example.com/uuid")).toBeNull();
  });
});

describe("optional fields", () => {
  it("omits empty optional fields from HTML", () => {
    const result = renderSignature(
      withFields({
        phone: "",
        address: "",
        website: "",
        linkedin: "",
        x: "",
        facebook: "",
        instagram: "",
        github: "",
      }),
    );

    expect(result.html).toContain("Jane Rivera");
    expect(result.html).toContain("mailto:jane@northwindlabs.example");
    expect(result.html).not.toContain("tel:");
    expect(result.html).not.toContain("LinkedIn");
    expect(result.html).not.toContain("Market Street");
  });

  it("includes email, phone, website, and social links when present", () => {
    const result = renderSignature(EXAMPLE_INPUT);
    expect(result.html).toContain("mailto:jane@northwindlabs.example");
    expect(result.html).toContain("tel:+14155550198");
    expect(result.html).toContain("https://northwindlabs.example/");
    expect(result.html).toContain("https://www.linkedin.com/in/example");
    expect(result.html).toContain("https://github.com/example");
    expect(result.plainText).toContain("Jane Rivera");
  });
});

describe("templates", () => {
  it("renders every template as table-based email HTML", () => {
    for (const template of SIGNATURE_TEMPLATES) {
      const result = renderSignature(
        withFields({}, { options: { ...EXAMPLE_INPUT.options, template } }),
      );

      expect(result.html, template).toContain("<table");
      expect(result.html, template).toContain("<tr>");
      expect(result.html, template).toContain("<td");
      expect(result.html, template).not.toContain("class=");
      expect(result.html, template).not.toMatch(/\b(flex|grid)\b/);
      expect(result.html, template).not.toContain("<script");
      expect(result.document, template).toContain("<!DOCTYPE html>");
    }
  });

  it("uses a distinct layout per template", () => {
    const html = Object.fromEntries(
      SIGNATURE_TEMPLATES.map((template) => [
        template,
        renderSignature(
          withFields({}, { options: { ...EXAMPLE_INPUT.options, template } }),
        ).html,
      ]),
    ) as Record<SignatureTemplateId, string>;

    const unique = new Set(Object.values(html));
    expect(unique.size).toBe(SIGNATURE_TEMPLATES.length);
    expect(html.corporate).toContain("background-color:#0f6e56");
    expect(html.compact).toContain(" | ");
    expect(html.executive).toContain("font-size:22px");
  });
});

describe("malicious input", () => {
  it("does not inject script tags or event handlers from fields", () => {
    const result = renderSignature(
      withFields({
        fullName: `<img src=x onerror=alert(1)>`,
        jobTitle: `</td><script>alert(1)</script>`,
        company: `" onclick="alert(1)"`,
        address: `<iframe src="javascript:alert(1)">`,
        linkedin: `javascript:alert(1)`,
        website: `javascript:alert(document.cookie)`,
      }),
    );

    expect(result.html).toContain("&lt;img");
    expect(result.html).toContain("&lt;script&gt;");
    expect(result.html).not.toContain("<script>");
    expect(result.html).not.toContain("<img src=x");
    expect(result.html).not.toContain('href="javascript:');
    expect(result.html).not.toContain('src="javascript:');
    expect(result.html).not.toContain("<iframe");
  });
});

describe("empty signature", () => {
  it("still returns a table when every field is empty", () => {
    const result = renderSignature(EMPTY_INPUT);
    expect(result.html).toContain("<table");
    expect(result.html).not.toContain("mailto:");
    expect(result.plainText).toBe("");
  });
});

describe("images", () => {
  it("uses hosted https URLs in export HTML", () => {
    const result = renderSignature({
      ...EXAMPLE_INPUT,
      photo: { origin: "hosted", url: "https://cdn.example.com/jane.png" },
      options: { ...EXAMPLE_INPUT.options, showPhoto: true, template: "corporate" },
    });

    expect(result.html).toContain('src="https://cdn.example.com/jane.png"');
    expect(result.warnings).toHaveLength(0);
  });

  it("warns when a local data image is embedded", () => {
    const result = renderSignature({
      ...EXAMPLE_INPUT,
      photo: {
        origin: "local",
        url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      },
      options: { ...EXAMPLE_INPUT.options, showPhoto: true, template: "corporate" },
    });

    expect(result.html).toContain("data:image/png;base64,");
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe("prepareSignature", () => {
  it("hides socials when the toggle is off", () => {
    const ctx = prepareSignature(
      withFields({}, { options: { ...EXAMPLE_INPUT.options, showSocial: false } }),
    );
    expect(ctx.socials).toEqual([]);
    expect(ctx.showSocial).toBe(false);
  });
});
