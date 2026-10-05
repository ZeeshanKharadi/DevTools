import type { Clock } from "../clock";
import { toIso } from "../clock";
import type { Repositories } from "../db/repositories";
import type { SubscriptionRecord } from "../db/types";
import { createId } from "../ids";
import { HttpError } from "../http";
import {
  StripeError,
  subscriptionPriceId,
  unixToIso,
  type StripeClient,
  type StripeEvent,
  type StripeSubscription,
} from "../stripe/client";

export type BillingConfig = {
  priceId: string;
  webhookSecret: string;
  publicBaseUrl: string;
};

export type PublicSubscription = {
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  entitled: boolean;
};

export type BillingService = {
  createCheckoutSession(userId: string, email: string): Promise<{ url: string }>;
  getSubscription(
    userId: string,
  ): Promise<{ subscription: PublicSubscription; entitled: boolean }>;
  handleWebhook(payload: string, signatureHeader: string | null): Promise<{
    received: true;
    duplicate?: boolean;
  }>;
};

const HANDLED_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
]);

export function isSubscriptionEntitled(
  record: SubscriptionRecord | null,
  now: Date,
): boolean {
  if (!record) {
    return false;
  }

  const periodEnd = new Date(record.currentPeriodEnd).getTime();
  if (!Number.isFinite(periodEnd) || periodEnd <= now.getTime()) {
    return false;
  }

  switch (record.status) {
    case "active":
    case "trialing":
    case "past_due":
    case "canceled":
      return true;
    case "unpaid":
      return periodEnd > now.getTime();
    default:
      return false;
  }
}

function toPublicSubscription(
  record: SubscriptionRecord | null,
  entitled: boolean,
): PublicSubscription {
  if (!record) {
    return {
      status: "none",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      entitled,
    };
  }

  return {
    status: record.status,
    cancelAtPeriodEnd: record.cancelAtPeriodEnd,
    currentPeriodEnd: record.currentPeriodEnd,
    entitled,
  };
}

export function createBillingService(
  repos: Repositories,
  clock: Clock,
  stripe: StripeClient,
  config: BillingConfig,
): BillingService {
  async function upsertFromStripeSubscription(
    subscription: StripeSubscription,
    userIdHint?: string | null,
  ) {
    const userId =
      userIdHint ||
      subscription.metadata?.userId ||
      (
        await repos.subscriptions.findByStripeSubscriptionId(subscription.id)
      )?.userId ||
      (
        await repos.subscriptions.findByStripeCustomerId(
          String(subscription.customer),
        )
      )?.userId ||
      (
        await findUserIdByCustomer(String(subscription.customer))
      );

    if (!userId) {
      throw new HttpError(
        400,
        "billing_user_missing",
        "Could not map Stripe subscription to an InfyraTools user.",
      );
    }

    const nowIso = toIso(clock.now());
    const existing = await repos.subscriptions.findByStripeSubscriptionId(
      subscription.id,
    );
    const priceId = subscriptionPriceId(subscription) || config.priceId;
    await repos.subscriptions.upsert({
      id: existing?.id ?? createId(),
      userId,
      stripeCustomerId: String(subscription.customer),
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: subscription.status,
      currentPeriodStart: unixToIso(subscription.current_period_start),
      currentPeriodEnd: unixToIso(subscription.current_period_end),
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: nowIso,
    });

    const user = await repos.users.findById(userId);
    if (user && !user.stripeCustomerId) {
      await repos.users.setStripeCustomerId(
        userId,
        String(subscription.customer),
      );
    }
  }

  async function findUserIdByCustomer(
    stripeCustomerId: string,
  ): Promise<string | null> {
    const bySubscription =
      await repos.subscriptions.findByStripeCustomerId(stripeCustomerId);
    if (bySubscription) {
      return bySubscription.userId;
    }
    const user = await repos.users.findByStripeCustomerId(stripeCustomerId);
    return user?.id ?? null;
  }

  async function processEvent(event: StripeEvent) {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          mode?: string;
          customer?: string | null;
          subscription?: string | null;
          client_reference_id?: string | null;
          metadata?: Record<string, string>;
        };
        if (session.mode && session.mode !== "subscription") {
          return;
        }
        const userId =
          session.client_reference_id || session.metadata?.userId || null;
        if (session.customer && userId) {
          await repos.users.setStripeCustomerId(userId, String(session.customer));
        }
        if (session.subscription) {
          const subscription = await stripe.retrieveSubscription(
            String(session.subscription),
          );
          await upsertFromStripeSubscription(subscription, userId);
        }
        return;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as unknown as StripeSubscription;
        await upsertFromStripeSubscription(subscription);
        return;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as {
          subscription?: string | null;
          customer?: string | null;
        };
        if (!invoice.subscription) {
          return;
        }
        const subscription = await stripe.retrieveSubscription(
          String(invoice.subscription),
        );
        await upsertFromStripeSubscription(subscription);
        return;
      }
      default:
        return;
    }
  }

  return {
    async createCheckoutSession(userId, email) {
      if (!config.priceId) {
        throw new HttpError(
          503,
          "billing_unavailable",
          "Stripe billing is not configured.",
        );
      }

      const user = await repos.users.findById(userId);
      if (!user) {
        throw new HttpError(401, "unauthenticated", "Sign in to continue.");
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const existingSub = await repos.subscriptions.findByUserId(userId);
        customerId = existingSub?.stripeCustomerId ?? null;
      }

      if (!customerId) {
        try {
          const customer = await stripe.createCustomer({
            email,
            metadata: { userId },
          });
          customerId = customer.id;
          await repos.users.setStripeCustomerId(userId, customerId);
        } catch (error) {
          if (error instanceof StripeError) {
            throw new HttpError(
              error.status >= 500 ? 503 : 502,
              "billing_unavailable",
              "Could not start checkout. Try again in a moment.",
            );
          }
          throw error;
        }
      }

      try {
        const session = await stripe.createCheckoutSession({
          customerId,
          priceId: config.priceId,
          successUrl: `${config.publicBaseUrl}/dashboard?checkout=success`,
          cancelUrl: `${config.publicBaseUrl}/dashboard?checkout=canceled`,
          clientReferenceId: userId,
          metadata: { userId },
        });
        if (!session.url) {
          throw new HttpError(
            502,
            "billing_unavailable",
            "Could not start checkout. Try again in a moment.",
          );
        }
        return { url: session.url };
      } catch (error) {
        if (error instanceof HttpError) {
          throw error;
        }
        if (error instanceof StripeError) {
          throw new HttpError(
            error.status >= 500 ? 503 : 502,
            "billing_unavailable",
            "Could not start checkout. Try again in a moment.",
          );
        }
        throw error;
      }
    },

    async getSubscription(userId) {
      const record = await repos.subscriptions.findByUserId(userId);
      const entitled = isSubscriptionEntitled(record, clock.now());
      return {
        subscription: toPublicSubscription(record, entitled),
        entitled,
      };
    },

    async handleWebhook(payload, signatureHeader) {
      if (!config.webhookSecret) {
        throw new HttpError(
          503,
          "billing_unavailable",
          "Stripe billing is not configured.",
        );
      }
      if (!signatureHeader) {
        throw new HttpError(
          400,
          "invalid_webhook_signature",
          "Missing Stripe signature.",
        );
      }

      let event: StripeEvent;
      try {
        event = await stripe.constructEvent(
          payload,
          signatureHeader,
          config.webhookSecret,
        );
      } catch (error) {
        if (error instanceof StripeError) {
          throw new HttpError(400, "invalid_webhook_signature", error.message);
        }
        throw error;
      }

      if (await repos.processedStripeEvents.has(event.id)) {
        return { received: true as const, duplicate: true };
      }

      if (HANDLED_EVENTS.has(event.type)) {
        await processEvent(event);
      }

      const recorded = await repos.processedStripeEvents.record({
        eventId: event.id,
        eventType: event.type,
        processedAt: toIso(clock.now()),
      });
      if (!recorded) {
        return { received: true as const, duplicate: true };
      }

      return { received: true as const };
    },
  };
}
