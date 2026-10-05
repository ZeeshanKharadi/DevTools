import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import { createMemoryRepositories } from "./db/memory";
import { RecordingEmailSender } from "./email";
import { SESSION_COOKIE } from "./http";
import { EXAMPLE_INPUT as CARD_EXAMPLE } from "../../lib/tools/digital-business-card/constants";
import { EXAMPLE_INPUT as INVOICE_EXAMPLE } from "../../lib/tools/invoice-generator/constants";

const ORIGIN = "http://localhost:3000";
const password = "correct-horse-battery";

function cookieFrom(response: Response): string | null {
  const header = response.headers.get("set-cookie");
  if (!header) {
    return null;
  }

  const match = header.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function makeApp() {
  const emails = new RecordingEmailSender();
  const app = createApp({
    repos: createMemoryRepositories(),
    email: emails,
    config: {
      allowedOrigins: [ORIGIN],
      cookieSecure: false,
      cookieSameSite: "Lax",
      publicBaseUrl: "https://infyratools.com",
      proBetaAccess: true,
      stripePriceId: "",
      stripeWebhookSecret: "",
    },
  });
  return { app, emails };
}

async function request(
  app: ReturnType<typeof createApp>,
  method: string,
  path: string,
  options: {
    body?: unknown;
    cookie?: string | null;
    origin?: string;
  } = {},
) {
  const headers = new Headers();
  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
  }
  if (options.cookie) {
    headers.set("cookie", `${SESSION_COOKIE}=${encodeURIComponent(options.cookie)}`);
  }
  if (options.origin) {
    headers.set("origin", options.origin);
  }

  return app.fetch(
    new Request(`https://infyratools.com${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    }),
  );
}

async function register(
  app: ReturnType<typeof createApp>,
  emails: RecordingEmailSender,
  email: string,
) {
  const response = await request(app, "POST", "/api/auth/register", {
    body: { email, password },
  });
  const cookie = cookieFrom(response)!;
  const code = emails.lastVerificationCode();
  await request(app, "POST", "/api/auth/verify-email", {
    cookie,
    body: { code },
  });
  return cookie;
}

describe("business cards API", () => {
  it("creates, lists, edits, duplicates, and deletes a card", async () => {
    const { app, emails } = makeApp();
    const cookie = await register(app, emails, "owner@example.com");
    const created = await request(app, "POST", "/api/cards", {
      cookie,
      body: { name: "Work Card", slug: "jane-rivera", data: CARD_EXAMPLE },
    });
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as {
      card: { id: string; publicSlug: string; publicUrl: string };
    };
    expect(createdBody.card.publicSlug).toBe("jane-rivera");
    expect(createdBody.card.publicUrl).toBe("https://infyratools.com/card/jane-rivera");
    const id = createdBody.card.id;

    expect((await request(app, "GET", `/api/cards/${id}`, { cookie })).status).toBe(200);
    const list = (await (
      await request(app, "GET", "/api/cards", { cookie })
    ).json()) as { cards: { id: string }[] };
    expect(list.cards).toHaveLength(1);

    const updated = await request(app, "PUT", `/api/cards/${id}`, {
      cookie,
      body: {
        name: "Studio Card",
        data: {
          ...CARD_EXAMPLE,
          fields: { ...CARD_EXAMPLE.fields, fullName: "Ada Lovelace" },
        },
      },
    });
    expect(updated.status).toBe(200);

    expect(
      (await request(app, "POST", `/api/cards/${id}/duplicate`, { cookie })).status,
    ).toBe(201);
    const listed = (await (
      await request(app, "GET", "/api/cards", { cookie })
    ).json()) as { cards: { publicSlug: string }[] };
    expect(listed.cards).toHaveLength(2);
    expect(new Set(listed.cards.map((card) => card.publicSlug)).size).toBe(2);

    expect((await request(app, "DELETE", `/api/cards/${id}`, { cookie })).status).toBe(200);
    expect((await request(app, "GET", `/api/cards/${id}`, { cookie })).status).toBe(404);
  });

  it("rejects a duplicate public slug", async () => {
    const { app, emails } = makeApp();
    const owner = await register(app, emails, "owner@example.com");
    const other = await register(app, emails, "other@example.com");
    expect(
      (
        await request(app, "POST", "/api/cards", {
          cookie: owner,
          body: { name: "One", slug: "shared-slug", data: CARD_EXAMPLE },
        })
      ).status,
    ).toBe(201);
    expect(
      (
        await request(app, "POST", "/api/cards", {
          cookie: other,
          body: { name: "Two", slug: "shared-slug", data: CARD_EXAMPLE },
        })
      ).status,
    ).toBe(409);
  });

  it("serves an active public card and hides an inactive one", async () => {
    const { app, emails } = makeApp();
    const cookie = await register(app, emails, "owner@example.com");
    const created = await request(app, "POST", "/api/cards", {
      cookie,
      body: {
        name: "Public Card",
        slug: "public-card",
        data: {
          ...CARD_EXAMPLE,
          fields: {
            ...CARD_EXAMPLE.fields,
            fullName: `<script>alert(1)</script>`,
            bio: `<img src=x onerror=alert(1)>`,
            website: "javascript:alert(1)",
          },
        },
      },
    });
    expect(created.status).toBe(201);

    const page = await request(app, "GET", "/card/public-card");
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toContain("javascript:alert(1)");
    expect(html).toContain('rel="canonical" href="https://infyratools.com/card/public-card"');
    expect(html).toContain('name="description"');
    expect(html).toContain("Head of Product");
    expect(html).toContain('content="noindex, nofollow"');
    expect(page.headers.get("content-security-policy") ?? "").toContain("frame-ancestors 'none'");
    expect(page.headers.get("content-security-policy") ?? "").toContain("object-src 'none'");

    const id = ((await created.json()) as { card: { id: string } }).card.id;
    await request(app, "PUT", `/api/cards/${id}`, {
      cookie,
      body: { isActive: false },
    });
    expect((await request(app, "GET", "/card/public-card")).status).toBe(404);
  });

  it("rejects unauthenticated writes and cross-user management", async () => {
    const { app, emails } = makeApp();
    const owner = await register(app, emails, "owner@example.com");
    const created = await request(app, "POST", "/api/cards", {
      cookie: owner,
      body: { name: "Private", data: CARD_EXAMPLE },
    });
    const id = ((await created.json()) as { card: { id: string } }).card.id;
    const other = await register(app, emails, "intruder@example.com");

    expect((await request(app, "GET", `/api/cards/${id}`)).status).toBe(401);
    expect((await request(app, "GET", `/api/cards/${id}`, { cookie: other })).status).toBe(
      404,
    );
    expect(
      (await request(app, "DELETE", `/api/cards/${id}`, { cookie: other })).status,
    ).toBe(404);
    expect(
      (
        await request(app, "PUT", `/api/cards/${id}`, {
          cookie: other,
          body: { name: "Stolen" },
        })
      ).status,
    ).toBe(404);
    const otherList = (await (
      await request(app, "GET", "/api/cards", { cookie: other })
    ).json()) as { cards: { id: string }[] };
    expect(otherList.cards).toHaveLength(0);
  });
});

describe("dynamic QR API", () => {
  it("creates a code, updates the destination without changing the code, and redirects", async () => {
    const { app, emails } = makeApp();
    const cookie = await register(app, emails, "owner@example.com");
    const created = await request(app, "POST", "/api/qr", {
      cookie,
      body: { name: "Site QR", destinationUrl: "https://example.com/start" },
    });
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as {
      qrCode: { id: string; code: string; publicUrl: string };
    };
    const { id, code } = createdBody.qrCode;
    expect(createdBody.qrCode.publicUrl).toBe(`https://infyratools.com/q/${code}`);

    const updated = await request(app, "PUT", `/api/qr/${id}`, {
      cookie,
      body: { destinationUrl: "https://example.com/next" },
    });
    const updatedBody = (await updated.json()) as {
      qrCode: { code: string; destinationUrl: string };
    };
    expect(updatedBody.qrCode.code).toBe(code);
    expect(updatedBody.qrCode.destinationUrl).toBe("https://example.com/next");

    const redirect = await request(app, "GET", `/q/${code}`);
    expect(redirect.status).toBe(302);
    expect(redirect.headers.get("location")).toBe("https://example.com/next");

    const listed = (await (
      await request(app, "GET", "/api/qr", { cookie })
    ).json()) as { qrCodes: { totalScans: number; lastScannedAt: string | null }[] };
    expect(listed.qrCodes[0].totalScans).toBe(1);
    expect(listed.qrCodes[0].lastScannedAt).toBeTruthy();
  });

  it("does not redirect inactive or missing codes and rejects unsafe destinations", async () => {
    const { app, emails } = makeApp();
    const cookie = await register(app, emails, "owner@example.com");
    expect(
      (
        await request(app, "POST", "/api/qr", {
          cookie,
          body: { name: "Bad", destinationUrl: "javascript:alert(1)" },
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app, "POST", "/api/qr", {
          cookie,
          body: { name: "Bad", destinationUrl: "data:text/html,hi" },
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app, "POST", "/api/qr", {
          cookie,
          body: { name: "Bad", destinationUrl: "file:///tmp" },
        })
      ).status,
    ).toBe(400);

    const created = await request(app, "POST", "/api/qr", {
      cookie,
      body: { name: "Pause", destinationUrl: "https://example.com" },
    });
    const body = (await created.json()) as { qrCode: { id: string; code: string } };
    await request(app, "PUT", `/api/qr/${body.qrCode.id}`, {
      cookie,
      body: { isActive: false },
    });
    expect((await request(app, "GET", `/q/${body.qrCode.code}`)).status).toBe(410);
    const still = (await (
      await request(app, "GET", `/api/qr/${body.qrCode.id}`, { cookie })
    ).json()) as { qrCode: { totalScans: number } };
    expect(still.qrCode.totalScans).toBe(0);
    expect((await request(app, "GET", "/q/missingcode")).status).toBe(404);
    expect((await request(app, "GET", "/q/nope")).status).toBe(404);
  });

  it("rejects cross-user management", async () => {
    const { app, emails } = makeApp();
    const owner = await register(app, emails, "owner@example.com");
    const created = await request(app, "POST", "/api/qr", {
      cookie: owner,
      body: { name: "Private", destinationUrl: "https://example.com" },
    });
    const id = ((await created.json()) as { qrCode: { id: string } }).qrCode.id;
    const other = await register(app, emails, "intruder@example.com");
    expect((await request(app, "GET", `/api/qr/${id}`, { cookie: other })).status).toBe(404);
    expect(
      (
        await request(app, "PUT", `/api/qr/${id}`, {
          cookie: other,
          body: { destinationUrl: "https://evil.example" },
        })
      ).status,
    ).toBe(404);
    expect((await request(app, "DELETE", `/api/qr/${id}`, { cookie: other })).status).toBe(
      404,
    );
    const otherList = (await (
      await request(app, "GET", "/api/qr", { cookie: other })
    ).json()) as { qrCodes: { id: string }[] };
    expect(otherList.qrCodes).toHaveLength(0);
  });
});

describe("invoices and customers API", () => {
  it("creates, searches, duplicates, changes status, and deletes invoices", async () => {
    const { app, emails } = makeApp();
    const cookie = await register(app, emails, "owner@example.com");
    const created = await request(app, "POST", "/api/invoices", {
      cookie,
      body: { data: INVOICE_EXAMPLE },
    });
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as {
      invoice: { id: string; invoiceNumber: string; status: string };
    };
    expect(createdBody.invoice.invoiceNumber).toBe("INV-1042");
    expect(createdBody.invoice.status).toBe("draft");
    const id = createdBody.invoice.id;

    const searched = (await (
      await request(app, "GET", "/api/invoices?q=INV-1042", { cookie })
    ).json()) as { invoices: { id: string }[] };
    expect(searched.invoices).toHaveLength(1);

    const status = await request(app, "PUT", `/api/invoices/${id}`, {
      cookie,
      body: { status: "paid" },
    });
    expect(
      ((await status.json()) as { invoice: { status: string } }).invoice.status,
    ).toBe("paid");

    expect(
      (await request(app, "POST", `/api/invoices/${id}/duplicate`, { cookie })).status,
    ).toBe(201);
    expect((await request(app, "DELETE", `/api/invoices/${id}`, { cookie })).status).toBe(
      200,
    );
    expect((await request(app, "GET", `/api/invoices/${id}`, { cookie })).status).toBe(404);
  });

  it("rejects cross-user invoice access", async () => {
    const { app, emails } = makeApp();
    const owner = await register(app, emails, "owner@example.com");
    const created = await request(app, "POST", "/api/invoices", {
      cookie: owner,
      body: { data: INVOICE_EXAMPLE },
    });
    const id = ((await created.json()) as { invoice: { id: string } }).invoice.id;
    const other = await register(app, emails, "intruder@example.com");
    expect((await request(app, "GET", `/api/invoices/${id}`, { cookie: other })).status).toBe(
      404,
    );
    expect(
      (
        await request(app, "PUT", `/api/invoices/${id}`, {
          cookie: other,
          body: { status: "paid" },
        })
      ).status,
    ).toBe(404);
    expect(
      (await request(app, "POST", `/api/invoices/${id}/duplicate`, { cookie: other })).status,
    ).toBe(404);
    expect(
      (await request(app, "DELETE", `/api/invoices/${id}`, { cookie: other })).status,
    ).toBe(404);
    const otherList = (await (
      await request(app, "GET", "/api/invoices", { cookie: other })
    ).json()) as { invoices: { id: string }[] };
    expect(otherList.invoices).toHaveLength(0);
  });

  it("creates, updates, and deletes owned customers only", async () => {
    const { app, emails } = makeApp();
    const owner = await register(app, emails, "owner@example.com");
    const created = await request(app, "POST", "/api/customers", {
      cookie: owner,
      body: {
        name: "Jordan Lee",
        email: "ap@contoso.example",
        company: "Contoso Studio",
      },
    });
    expect(created.status).toBe(201);
    const id = ((await created.json()) as { customer: { id: string } }).customer.id;
    expect(
      (
        await request(app, "PUT", `/api/customers/${id}`, {
          cookie: owner,
          body: { phone: "+1 206 555 0148" },
        })
      ).status,
    ).toBe(200);

    const other = await register(app, emails, "intruder@example.com");
    expect(
      (await request(app, "GET", `/api/customers/${id}`, { cookie: other })).status,
    ).toBe(404);
    expect(
      (
        await request(app, "PUT", `/api/customers/${id}`, {
          cookie: other,
          body: { name: "Stolen" },
        })
      ).status,
    ).toBe(404);
    expect(
      (await request(app, "DELETE", `/api/customers/${id}`, { cookie: other })).status,
    ).toBe(404);
    const otherList = (await (
      await request(app, "GET", "/api/customers", { cookie: other })
    ).json()) as { customers: { id: string }[] };
    expect(otherList.customers).toHaveLength(0);
    expect(
      (await request(app, "DELETE", `/api/customers/${id}`, { cookie: owner })).status,
    ).toBe(200);
  });
});

describe("dashboard summary and business profile", () => {
  it("returns real counts and stores an optional profile", async () => {
    const { app, emails } = makeApp();
    const cookie = await register(app, emails, "owner@example.com");
    await request(app, "POST", "/api/cards", {
      cookie,
      body: { name: "Card", data: CARD_EXAMPLE },
    });
    await request(app, "POST", "/api/qr", {
      cookie,
      body: { name: "QR", destinationUrl: "https://example.com" },
    });
    const inactiveQr = await request(app, "POST", "/api/qr", {
      cookie,
      body: { name: "Paused", destinationUrl: "https://example.com/paused", isActive: false },
    });
    expect(inactiveQr.status).toBe(201);
    await request(app, "POST", "/api/invoices", {
      cookie,
      body: { data: INVOICE_EXAMPLE },
    });

    const summary = (await (
      await request(app, "GET", "/api/dashboard/summary", { cookie })
    ).json()) as {
      summary: { signatures: number; cards: number; activeQr: number; invoices: number };
    };
    expect(summary.summary).toEqual({
      signatures: 0,
      cards: 1,
      activeQr: 1,
      invoices: 1,
    });

    const saved = await request(app, "PUT", "/api/account/profile", {
      cookie,
      body: {
        businessName: "Northwind Labs",
        website: "https://northwindlabs.example",
        logoUrl: "javascript:alert(1)",
      },
    });
    const profile = (await saved.json()) as { profile: { businessName: string; logoUrl: string } };
    expect(profile.profile.businessName).toBe("Northwind Labs");
    expect(profile.profile.logoUrl).toBe("");

    const other = await register(app, emails, "intruder@example.com");
    const otherProfile = (await (
      await request(app, "GET", "/api/account/profile", { cookie: other })
    ).json()) as { profile: { businessName: string } };
    expect(otherProfile.profile.businessName).toBe("");
    await request(app, "PUT", "/api/account/profile", {
      cookie: other,
      body: { businessName: "Stolen Labs" },
    });
    const ownerAgain = (await (
      await request(app, "GET", "/api/account/profile", { cookie })
    ).json()) as { profile: { businessName: string } };
    expect(ownerAgain.profile.businessName).toBe("Northwind Labs");
  });
});

describe("hardening: validation and independence", () => {
  it("duplicates a QR with a new code and zero scans", async () => {
    const { app, emails } = makeApp();
    const cookie = await register(app, emails, "owner@example.com");
    const created = await request(app, "POST", "/api/qr", {
      cookie,
      body: { name: "Original", destinationUrl: "https://example.com/a" },
    });
    const original = (await created.json()) as {
      qrCode: { id: string; code: string };
    };
    await request(app, "GET", `/q/${original.qrCode.code}`);

    const duplicated = await request(app, "POST", `/api/qr/${original.qrCode.id}/duplicate`, {
      cookie,
    });
    expect(duplicated.status).toBe(201);
    const copy = (await duplicated.json()) as {
      qrCode: { id: string; code: string; totalScans: number; destinationUrl: string };
    };
    expect(copy.qrCode.id).not.toBe(original.qrCode.id);
    expect(copy.qrCode.code).not.toBe(original.qrCode.code);
    expect(copy.qrCode.totalScans).toBe(0);
    expect(copy.qrCode.destinationUrl).toBe("https://example.com/a");
  });

  it("duplicates a card with a new slug", async () => {
    const { app, emails } = makeApp();
    const cookie = await register(app, emails, "owner@example.com");
    const created = await request(app, "POST", "/api/cards", {
      cookie,
      body: { name: "Original", slug: "owned-card", data: CARD_EXAMPLE },
    });
    const original = (await created.json()) as { card: { id: string; publicSlug: string } };
    const duplicated = await request(app, "POST", `/api/cards/${original.card.id}/duplicate`, {
      cookie,
    });
    const copy = (await duplicated.json()) as { card: { publicSlug: string; publicUrl: string } };
    expect(copy.card.publicSlug).not.toBe(original.card.publicSlug);
    expect(copy.card.publicUrl).toContain(copy.card.publicSlug);
    expect((await request(app, "GET", `/card/${original.card.publicSlug}`)).status).toBe(200);
    expect((await request(app, "GET", `/card/${copy.card.publicSlug}`)).status).toBe(200);
  });

  it("rejects non-boolean isActive flags and invalid invoice statuses", async () => {
    const { app, emails } = makeApp();
    const cookie = await register(app, emails, "owner@example.com");
    expect(
      (
        await request(app, "POST", "/api/qr", {
          cookie,
          body: { name: "Flag", destinationUrl: "https://example.com", isActive: "false" },
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app, "POST", "/api/cards", {
          cookie,
          body: { name: "Flag", data: CARD_EXAMPLE, isActive: "false" },
        })
      ).status,
    ).toBe(400);

    const invoice = await request(app, "POST", "/api/invoices", {
      cookie,
      body: { data: INVOICE_EXAMPLE },
    });
    const id = ((await invoice.json()) as { invoice: { id: string } }).invoice.id;
    expect(
      (
        await request(app, "PUT", `/api/invoices/${id}`, {
          cookie,
          body: { status: "overdue" },
        })
      ).status,
    ).toBe(400);
  });

  it("rejects malformed JSON and control characters in destinations", async () => {
    const { app, emails } = makeApp();
    const cookie = await register(app, emails, "owner@example.com");
    const malformed = await app.fetch(
      new Request("https://infyratools.com/api/cards", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `${SESSION_COOKIE}=${encodeURIComponent(cookie)}`,
        },
        body: "{not-json",
      }),
    );
    expect(malformed.status).toBe(400);
    const malformedBody = (await malformed.json()) as { error: { code: string } };
    expect(malformedBody.error.code).toBe("invalid_json");

    expect(
      (
        await request(app, "POST", "/api/qr", {
          cookie,
          body: { name: "Inject", destinationUrl: "https://example.com/\r\nSet-Cookie:x=1" },
        })
      ).status,
    ).toBe(400);
  });

  it("still redirects when scan recording fails", async () => {
    const repos = createMemoryRepositories();
    repos.qrCodes.recordScan = async () => {
      throw new Error("scan_failed");
    };
    const emails = new RecordingEmailSender();
    const app = createApp({
      repos,
      email: emails,
      config: {
        allowedOrigins: [ORIGIN],
        cookieSecure: false,
        cookieSameSite: "Lax",
        publicBaseUrl: "https://infyratools.com",
        proBetaAccess: true,
        stripePriceId: "",
        stripeWebhookSecret: "",
      },
    });
    const cookie = await register(app, emails, "owner@example.com");
    const created = await request(app, "POST", "/api/qr", {
      cookie,
      body: { name: "Live", destinationUrl: "https://example.com/ok" },
    });
    const code = ((await created.json()) as { qrCode: { code: string } }).qrCode.code;
    const redirect = await request(app, "GET", `/q/${code}`);
    expect(redirect.status).toBe(302);
    expect(redirect.headers.get("location")).toBe("https://example.com/ok");
  });

  it("returns HTML 404 for malformed public QR paths instead of 500", async () => {
    const { app } = makeApp();
    const response = await request(app, "GET", "/q/%E0%A4%A");
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("text/html");
  });
});
