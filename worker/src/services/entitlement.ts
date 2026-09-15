import { HttpError } from "../http";

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

export function createEntitlementService(): EntitlementService {
  return {
    async canUseFeature(userId) {
      return Boolean(userId);
    },
  };
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
