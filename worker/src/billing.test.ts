import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import { createMemoryRepositories } from "./db/memory";
import { RecordingEmailSender } from "./email";
import { SESSION_COOKIE } from "./http";
import {
  verifyStripeSignature,
  type StripeCheckoutSession,
  type StripeClient,
  type StripeCustomer,
  type StripeEvent,
  type StripeSubscription,
} from "./stripe/client";
import { isSubscriptionEntitled } from "./services/billing-service";
import type { SubscriptionRecord } from "./db/types";
import { EXAMPLE_INPUT } from "../../lib/tools/email-signature-generator/constants";

const ORIGIN = "http://localhost:3000";
const PRICE_ID = "price_test_pro";
const WEBHOOK_SECRET = "whsec_test_secret";
const password = "correct-horse-battery";

function cookieFrom(response: Response): string | null {
  const header = response.headers.get("set-cookie");
  if (!header) {
    return null;
  }
  const match = header.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function makeSubscription(overrides: Partial<StripeSubscription> = {}): StripeSubscription {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: "sub_test_1",
    customer: "cus_test_1",
    status: "active",
    cancel_at_period_end: false,
    current_period_start: now,
    current_period_end: now + 30 * 24 * 60 * 60,
    items: { data: [{ price: { id: PRICE_ID } }] },
    metadata: {},
    ...overrides,
  };
}

function createFakeStripe(options?: {
  customers?: Map<string, StripeCustomer>;
  subscriptions?: Map<string, StripeSubscription>;
}): StripeClient & {
  customers: Map<string, StripeCustomer>;
  subscriptions: Map<string, StripeSubscription>;
  checkoutSessions: StripeCheckoutSession[];
} {
  const customers = options?.customers ?? new Map<string, StripeCustomer>();
  const subscriptions =
    options?.subscriptions ?? new Map<string, StripeSubscription>();
  const checkoutSessions: StripeCheckoutSession[] = [];
  let customerCount = 0;

  return {
    customers,
    subscriptions,
    checkoutSessions,
    async createCustomer({ email, metadata }) {
      customerCount += 1;
      const customer: StripeCustomer = {
        id: `cus_test_${customerCount}`,
        email,
        metadata,
      };
      customers.set(customer.id, customer);
      return customer;
    },
    async createCheckoutSession(input) {
      const session: StripeCheckoutSession = {
        id: `cs_test_${checkoutSessions.length + 1}`,
        url: `https://checkout.stripe.com/c/pay/cs_test_${checkoutSessions.length + 1}`,
        customer: input.customerId,
        subscription: null,
        metadata: input.metadata,
        mode: "subscription",
      };
      checkoutSessions.push(session);
      return session;
    },
    async retrieveSubscription(subscriptionId) {
      const subscription = subscriptions.get(subscriptionId);
      if (!subscription) {
        throw new Error(`missing subscription ${subscriptionId}`);
      }
      return subscription;
    },
    async constructEvent(payload, signatureHeader, webhookSecret) {
      const valid = await verifyStripeSignature(
        payload,
        signatureHeader,
        webhookSecret,
        300,
        Math.floor(Date.now() / 1000),
      );
      if (!valid) {
        const { StripeError } = await import("./stripe/client");
        throw new StripeError(400, "Invalid Stripe webhook signature.");
      }
      return JSON.parse(payload) as StripeEvent;
    },
  };
}

async function signPayload(payload: string, secret = WEBHOOK_SECRET): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  const hex = [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `t=${timestamp},v1=${hex}`;
}

function makeApp(options?: {
  now?: Date;
  betaAccess?: boolean;
  stripe?: ReturnType<typeof createFakeStripe>;
}) {
  let current = options?.now ?? new Date("2026-09-14T12:00:00.000Z");
  const clock = {
    now() {
      return current;
    },
    set(date: Date) {
      current = date;
    },
  };
  const repos = createMemoryRepositories();
  const emails = new RecordingEmailSender();
  const stripe = options?.stripe ?? createFakeStripe();
  const app = createApp({
    repos,
    clock,
    email: emails,
    stripe,
    config: {
      allowedOrigins: [ORIGIN],
      cookieSecure: false,
      cookieSameSite: "Lax",
      publicBaseUrl: "https://infyratools.com",
      proBetaAccess: options?.betaAccess ?? false,
      stripePriceId: PRICE_ID,
      stripeWebhookSecret: WEBHOOK_SECRET,
    },
  });
  return { app, clock, emails, repos, stripe };
}

async function request(
  app: ReturnType<typeof createApp>,
  method: string,
  path: string,
  options: {
    body?: unknown;
    rawBody?: string;
    cookie?: string | null;
    origin?: string;
    headers?: Record<string, string>;
  } = {},
) {
  const headers = new Headers(options.headers);
  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
  }
  if (options.cookie) {
    headers.set(
      "cookie",
      `${SESSION_COOKIE}=${encodeURIComponent(options.cookie)}`,
    );
  }
  if (options.origin) {
    headers.set("origin", options.origin);
  }

  return app.fetch(
    new Request(`https://infyratools.com${path}`, {
      method,
      headers,
      body:
        options.rawBody ??
        (options.body !== undefined ? JSON.stringify(options.body) : undefined),
    }),
  );
}

async function registerAndVerify(
  app: ReturnType<typeof createApp>,
  emails: RecordingEmailSender,
  email: string,
) {
  const registered = await request(app, "POST", "/api/auth/register", {
    body: { email, password },
  });
  expect(registered.status).toBe(201);
  const cookie = cookieFrom(registered)!;
  const code = emails.lastVerificationCode();
  const verified = await request(app, "POST", "/api/auth/verify-email", {
    cookie,
    body: { code },
  });
  expect(verified.status).toBe(200);
  return cookie;
}

async function postWebhook(
  app: ReturnType<typeof createApp>,
  event: StripeEvent,
  secret = WEBHOOK_SECRET,
) {
  const payload = JSON.stringify(event);
  const signature = await signPayload(payload, secret);
  return request(app, "POST", "/api/webhooks/stripe", {
    rawBody: payload,
    headers: { "stripe-signature": signature },
  });
}

describe("billing API", () => {
  it("lets an authenticated verified user create a Checkout session", async () => {
    const { app, emails, stripe, repos } = makeApp();
    const cookie = await registerAndVerify(app, emails, "pro@example.com");
    const user = await repos.users.findByEmail("pro@example.com");

    const response = await request(
      app,
      "POST",
      "/api/billing/create-checkout-session",
      { cookie },
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { url: string };
    expect(body.url).toContain("https://checkout.stripe.com/");
    expect(stripe.checkoutSessions).toHaveLength(1);
    expect(stripe.checkoutSessions[0].metadata.userId).toBe(user!.id);
    expect(stripe.checkoutSessions[0].customer).toBe(user!.stripeCustomerId);
  });

  it("rejects unauthenticated and unverified checkout requests", async () => {
    const { app, emails } = makeApp();
    const unauthenticated = await request(
      app,
      "POST",
      "/api/billing/create-checkout-session",
    );
    expect(unauthenticated.status).toBe(401);

    const registered = await request(app, "POST", "/api/auth/register", {
      body: { email: "pending@example.com", password },
    });
    const cookie = cookieFrom(registered);
    const unverified = await request(
      app,
      "POST",
      "/api/billing/create-checkout-session",
      { cookie },
    );
    expect(unverified.status).toBe(403);
    expect(emails.messages.length).toBeGreaterThan(0);
  });

  it("reuses an existing Stripe customer for the same user", async () => {
    const { app, emails, stripe, repos } = makeApp();
    const cookie = await registerAndVerify(app, emails, "reuse@example.com");
    await request(app, "POST", "/api/billing/create-checkout-session", {
      cookie,
    });
    const firstCustomerId = (await repos.users.findByEmail("reuse@example.com"))!
      .stripeCustomerId;
    await request(app, "POST", "/api/billing/create-checkout-session", {
      cookie,
    });
    expect(stripe.customers.size).toBe(1);
    expect(stripe.checkoutSessions[1].customer).toBe(firstCustomerId);
  });

  it("rejects invalid webhook signatures", async () => {
    const { app } = makeApp();
    const payload = JSON.stringify({
      id: "evt_bad",
      type: "customer.subscription.updated",
      data: { object: makeSubscription() },
    });
    const response = await request(app, "POST", "/api/webhooks/stripe", {
      rawBody: payload,
      headers: { "stripe-signature": "t=1,v1=deadbeef" },
    });
    expect(response.status).toBe(400);
  });

  it("handles checkout.session.completed and subscription lifecycle", async () => {
    const stripe = createFakeStripe();
    const { app, emails, repos, clock } = makeApp({ stripe });
    const cookie = await registerAndVerify(app, emails, "lifecycle@example.com");
    const user = (await repos.users.findByEmail("lifecycle@example.com"))!;

    await request(app, "POST", "/api/billing/create-checkout-session", {
      cookie,
    });
    const customerId = user.stripeCustomerId!;
    const subscription = makeSubscription({
      id: "sub_lifecycle",
      customer: customerId,
      metadata: { userId: user.id },
    });
    stripe.subscriptions.set(subscription.id, subscription);

    const checkoutEvent: StripeEvent = {
      id: "evt_checkout_1",
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          customer: customerId,
          subscription: subscription.id,
          client_reference_id: user.id,
          metadata: { userId: user.id },
        },
      },
    };
    expect((await postWebhook(app, checkoutEvent)).status).toBe(200);

    let status = await request(app, "GET", "/api/billing/subscription", {
      cookie,
    });
    let body = (await status.json()) as {
      entitled: boolean;
      subscription: { status: string; cancelAtPeriodEnd?: boolean };
    };
    expect(body.entitled).toBe(true);
    expect(body.subscription.status).toBe("active");

    const updated = makeSubscription({
      id: "sub_lifecycle",
      customer: customerId,
      status: "active",
      cancel_at_period_end: true,
      metadata: { userId: user.id },
    });
    stripe.subscriptions.set(updated.id, updated);
    expect(
      (
        await postWebhook(app, {
          id: "evt_sub_updated",
          type: "customer.subscription.updated",
          data: { object: updated as unknown as Record<string, unknown> },
        })
      ).status,
    ).toBe(200);

    status = await request(app, "GET", "/api/billing/subscription", { cookie });
    body = (await status.json()) as {
      entitled: boolean;
      subscription: { status: string; cancelAtPeriodEnd?: boolean };
    };
    expect(body.entitled).toBe(true);
    expect(body.subscription.cancelAtPeriodEnd).toBe(true);

    const failed = makeSubscription({
      id: "sub_lifecycle",
      customer: customerId,
      status: "past_due",
      metadata: { userId: user.id },
    });
    stripe.subscriptions.set(failed.id, failed);
    expect(
      (
        await postWebhook(app, {
          id: "evt_invoice_failed",
          type: "invoice.payment_failed",
          data: {
            object: {
              subscription: failed.id,
              customer: customerId,
            },
          },
        })
      ).status,
    ).toBe(200);
    const afterFailure = await repos.subscriptions.findByUserId(user.id);
    expect(afterFailure).toBeTruthy();
    expect(afterFailure!.status).toBe("past_due");
    expect(isSubscriptionEntitled(afterFailure, clock.now())).toBe(true);

    const deleted = makeSubscription({
      id: "sub_lifecycle",
      customer: customerId,
      status: "canceled",
      current_period_end: Math.floor(clock.now().getTime() / 1000) - 60,
      metadata: { userId: user.id },
    });
    stripe.subscriptions.set(deleted.id, deleted);
    expect(
      (
        await postWebhook(app, {
          id: "evt_sub_deleted",
          type: "customer.subscription.deleted",
          data: { object: deleted as unknown as Record<string, unknown> },
        })
      ).status,
    ).toBe(200);

    status = await request(app, "GET", "/api/billing/subscription", { cookie });
    body = (await status.json()) as {
      entitled: boolean;
      subscription: { status: string; cancelAtPeriodEnd?: boolean };
    };
    expect(body.entitled).toBe(false);
    expect(await repos.subscriptions.findByUserId(user.id)).toBeTruthy();
  });

  it("ignores duplicate webhook events", async () => {
    const stripe = createFakeStripe();
    const { app, emails, repos } = makeApp({ stripe });
    const cookie = await registerAndVerify(app, emails, "dup@example.com");
    const user = (await repos.users.findByEmail("dup@example.com"))!;
    await request(app, "POST", "/api/billing/create-checkout-session", {
      cookie,
    });
    const subscription = makeSubscription({
      id: "sub_dup",
      customer: user.stripeCustomerId!,
      metadata: { userId: user.id },
    });
    stripe.subscriptions.set(subscription.id, subscription);

    const event: StripeEvent = {
      id: "evt_dup",
      type: "customer.subscription.created",
      data: { object: subscription as unknown as Record<string, unknown> },
    };
    expect((await postWebhook(app, event)).status).toBe(200);
    const duplicate = await postWebhook(app, event);
    expect(duplicate.status).toBe(200);
    expect(((await duplicate.json()) as { duplicate?: boolean }).duplicate).toBe(
      true,
    );
  });

  it("keeps Pro until period end when cancel_at_period_end is set", async () => {
    const now = new Date("2026-09-14T12:00:00.000Z");
    const record: SubscriptionRecord = {
      id: "subrec",
      userId: "user_1",
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
      stripePriceId: PRICE_ID,
      status: "active",
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    expect(isSubscriptionEntitled(record, now)).toBe(true);
    expect(
      isSubscriptionEntitled(
        { ...record, status: "canceled" },
        new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      ),
    ).toBe(false);
  });

  it("gates Pro features from Stripe state and isolates users", async () => {
    const stripe = createFakeStripe();
    const { app, emails, repos } = makeApp({ stripe, betaAccess: false });
    const ownerCookie = await registerAndVerify(app, emails, "owner@example.com");
    const otherCookie = await registerAndVerify(app, emails, "other@example.com");
    const owner = (await repos.users.findByEmail("owner@example.com"))!;

    expect(
      (
        await request(app, "POST", "/api/signatures", {
          cookie: ownerCookie,
          body: { name: "Blocked", data: EXAMPLE_INPUT },
        })
      ).status,
    ).toBe(403);

    await request(app, "POST", "/api/billing/create-checkout-session", {
      cookie: ownerCookie,
    });
    const subscription = makeSubscription({
      id: "sub_owner",
      customer: owner.stripeCustomerId!,
      metadata: { userId: owner.id },
    });
    stripe.subscriptions.set(subscription.id, subscription);
    await postWebhook(app, {
      id: "evt_owner_sub",
      type: "customer.subscription.created",
      data: { object: subscription as unknown as Record<string, unknown> },
    });

    const ownerStatus = await request(app, "GET", "/api/billing/subscription", {
      cookie: ownerCookie,
    });
    expect(((await ownerStatus.json()) as { entitled: boolean }).entitled).toBe(
      true,
    );

    const otherStatus = await request(app, "GET", "/api/billing/subscription", {
      cookie: otherCookie,
    });
    expect(((await otherStatus.json()) as { entitled: boolean }).entitled).toBe(
      false,
    );
  });
});
