import { createApp, type AppConfig } from "./app";
import { createD1Repositories } from "./db/d1";
import { createEmailSenderFromEnv } from "./email";
import {
  createStripeClient,
  createUnconfiguredStripeClient,
} from "./stripe/client";

export type WorkerEnv = {
  DB: {
    prepare(query: string): {
      bind(...values: unknown[]): {
        first<T = Record<string, unknown>>(): Promise<T | null>;
        run(): Promise<unknown>;
        all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
      };
    };
  };
  APP_ORIGIN?: string;
  PUBLIC_BASE_URL?: string;
  COOKIE_SECURE?: string;
  COOKIE_SAMESITE?: string;
  EMAIL_PROVIDER?: string;
  EMAIL_FROM?: string;
  RESEND_API_KEY?: string;
  PRO_BETA_ACCESS?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_ID?: string;
};

function configFromEnv(env: WorkerEnv): AppConfig {
  const origins = (env.APP_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const sameSite = env.COOKIE_SAMESITE?.toLowerCase() === "none" ? "None" : "Lax";

  return {
    allowedOrigins: origins,
    cookieSecure: env.COOKIE_SECURE === "true" || sameSite === "None",
    cookieSameSite: sameSite,
    publicBaseUrl: (env.PUBLIC_BASE_URL ?? "http://localhost:8787").replace(
      /\/$/,
      "",
    ),
    // Default true preserves complimentary Pro until Stripe is enabled and beta is turned off.
    proBetaAccess: env.PRO_BETA_ACCESS !== "false",
    stripePriceId: env.STRIPE_PRICE_ID?.trim() ?? "",
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET?.trim() ?? "",
  };
}

const worker = {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const secretKey = env.STRIPE_SECRET_KEY?.trim();
    const app = createApp({
      repos: createD1Repositories(env.DB),
      config: configFromEnv(env),
      email: createEmailSenderFromEnv(env),
      stripe: secretKey
        ? createStripeClient(secretKey)
        : createUnconfiguredStripeClient(),
    });
    return app.fetch(request);
  },
};

export default worker;
