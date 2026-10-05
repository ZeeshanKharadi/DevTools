export class StripeError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "StripeError";
  }
}

export type StripeCustomer = {
  id: string;
  email: string | null;
  metadata: Record<string, string>;
};

export type StripeCheckoutSession = {
  id: string;
  url: string | null;
  customer: string | null;
  subscription: string | null;
  metadata: Record<string, string>;
  mode: string;
};

export type StripeSubscriptionItem = {
  price: { id: string } | string;
};

export type StripeSubscription = {
  id: string;
  customer: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_start: number;
  current_period_end: number;
  items: { data: StripeSubscriptionItem[] };
  metadata: Record<string, string>;
};

export type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

export type StripeClient = {
  createCustomer(input: {
    email: string;
    metadata: Record<string, string>;
  }): Promise<StripeCustomer>;
  createCheckoutSession(input: {
    customerId: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    clientReferenceId: string;
    metadata: Record<string, string>;
  }): Promise<StripeCheckoutSession>;
  retrieveSubscription(subscriptionId: string): Promise<StripeSubscription>;
  constructEvent(
    payload: string,
    signatureHeader: string,
    webhookSecret: string,
  ): Promise<StripeEvent>;
};

function encodeForm(data: Record<string, string>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    params.set(key, value);
  }
  return params.toString();
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
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
    new TextEncoder().encode(payload),
  );
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  webhookSecret: string,
  toleranceSeconds = 300,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  const parts = signatureHeader.split(",").map((part) => part.trim());
  let timestamp = "";
  const signatures: string[] = [];
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "t") {
      timestamp = value;
    } else if (key === "v1" && value) {
      signatures.push(value);
    }
  }

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const age = Math.abs(nowSeconds - Number(timestamp));
  if (!Number.isFinite(age) || age > toleranceSeconds) {
    return false;
  }

  const expected = await hmacSha256Hex(
    webhookSecret,
    `${timestamp}.${payload}`,
  );
  return signatures.some((signature) => timingSafeEqual(signature, expected));
}

export function createStripeClient(secretKey: string): StripeClient {
  async function stripeRequest<T>(
    method: string,
    path: string,
    body?: Record<string, string>,
  ): Promise<T> {
    const response = await fetch(`https://api.stripe.com/v1${path}`, {
      method,
      headers: {
        authorization: `Bearer ${secretKey}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: body ? encodeForm(body) : undefined,
    });

    const data = (await response.json()) as T & {
      error?: { message?: string };
    };
    if (!response.ok) {
      throw new StripeError(
        response.status,
        data.error?.message ?? "Stripe request failed.",
      );
    }
    return data;
  }

  return {
    async createCustomer({ email, metadata }) {
      const body: Record<string, string> = { email };
      for (const [key, value] of Object.entries(metadata)) {
        body[`metadata[${key}]`] = value;
      }
      return stripeRequest<StripeCustomer>("POST", "/customers", body);
    },

    async createCheckoutSession(input) {
      return stripeRequest<StripeCheckoutSession>(
        "POST",
        "/checkout/sessions",
        {
          mode: "subscription",
          customer: input.customerId,
          "line_items[0][price]": input.priceId,
          "line_items[0][quantity]": "1",
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          client_reference_id: input.clientReferenceId,
          "metadata[userId]": input.metadata.userId,
          "subscription_data[metadata][userId]": input.metadata.userId,
        },
      );
    },

    async retrieveSubscription(subscriptionId) {
      return stripeRequest<StripeSubscription>(
        "GET",
        `/subscriptions/${encodeURIComponent(subscriptionId)}`,
      );
    },

    async constructEvent(payload, signatureHeader, webhookSecret) {
      const valid = await verifyStripeSignature(
        payload,
        signatureHeader,
        webhookSecret,
      );
      if (!valid) {
        throw new StripeError(400, "Invalid Stripe webhook signature.");
      }

      let event: StripeEvent;
      try {
        event = JSON.parse(payload) as StripeEvent;
      } catch {
        throw new StripeError(400, "Invalid Stripe webhook payload.");
      }

      if (!event?.id || !event?.type || !event?.data?.object) {
        throw new StripeError(400, "Invalid Stripe webhook payload.");
      }
      return event;
    },
  };
}

export function createUnconfiguredStripeClient(): StripeClient {
  const unavailable = async () => {
    throw new StripeError(503, "Stripe billing is not configured.");
  };
  return {
    createCustomer: unavailable,
    createCheckoutSession: unavailable,
    retrieveSubscription: unavailable,
    constructEvent: unavailable,
  };
}

export function subscriptionPriceId(subscription: StripeSubscription): string {
  const item = subscription.items?.data?.[0];
  if (!item) {
    return "";
  }
  return typeof item.price === "string" ? item.price : item.price.id;
}

export function unixToIso(seconds: number): string {
  return new Date(seconds * 1000).toISOString();
}
