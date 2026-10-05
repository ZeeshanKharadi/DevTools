import type { Clock } from "../clock";
import type { Repositories } from "../db/repositories";
import { HttpError } from "../http";
import { isSubscriptionEntitled } from "./billing-service";

export type FeatureId =
  | "signatures"
  | "cards"
  | "dynamic_qr"
  | "invoices"
  | "customers"
  | "profile";

export type EntitlementService = {
  canUseFeature(userId: string, feature: FeatureId): Promise<boolean>;
};

/**
 * Beta entitlement: any authenticated user gets Pro.
 * Keep this path for easy disable — set PRO_BETA_ACCESS=false in production
 * once Stripe subscriptions are live.
 */
export function createBetaEntitlementService(): EntitlementService {
  return {
    async canUseFeature(userId) {
      return Boolean(userId);
    },
  };
}

/** Stripe/D1 subscription entitlement — authoritative paid access. */
export function createSubscriptionEntitlementService(
  repos: Repositories,
  clock: Clock,
): EntitlementService {
  return {
    async canUseFeature(userId) {
      if (!userId) {
        return false;
      }
      const subscription = await repos.subscriptions.findByUserId(userId);
      return isSubscriptionEntitled(subscription, clock.now());
    },
  };
}

export function createEntitlementService(options?: {
  betaAccess?: boolean;
  repos?: Repositories;
  clock?: Clock;
}): EntitlementService {
  if (options?.betaAccess) {
    return createBetaEntitlementService();
  }

  if (!options?.repos || !options?.clock) {
    // Safe default when misconfigured: deny Pro rather than grant it.
    return {
      async canUseFeature() {
        return false;
      },
    };
  }

  return createSubscriptionEntitlementService(options.repos, options.clock);
}

export async function requireFeature(
  entitlements: EntitlementService,
  userId: string,
  feature: FeatureId,
): Promise<void> {
  if (!(await entitlements.canUseFeature(userId, feature))) {
    throw new HttpError(
      403,
      "entitlement_required",
      "This InfyraTools Pro feature is not available on this account.",
    );
  }
}
