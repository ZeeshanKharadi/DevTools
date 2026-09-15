import { sanitizeEmail, sanitizeHttpUrl, sanitizePhone } from "../../../lib/tools/qr-code-generator/sanitize";
import type { Clock } from "../clock";
import { toIso } from "../clock";
import type { Repositories } from "../db/repositories";
import type { BusinessProfileRecord } from "../db/types";
import { parseOptionalText } from "../ids";
import { requireFeature, type EntitlementService } from "./entitlement";

export type BusinessProfile = {
  businessName: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  logoUrl: string;
  updatedAt: string | null;
};

const EMPTY_PROFILE: BusinessProfile = {
  businessName: "",
  name: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  logoUrl: "",
  updatedAt: null,
};

function toProfile(record: BusinessProfileRecord): BusinessProfile {
  return {
    businessName: record.businessName,
    name: record.name,
    email: record.email,
    phone: record.phone,
    website: record.website,
    address: record.address,
    logoUrl: record.logoUrl,
    updatedAt: record.updatedAt,
  };
}

function hostedLogo(raw: unknown): string {
  const value = parseOptionalText(raw, 500);
  if (!value) {
    return "";
  }
  if (value.startsWith("data:image/")) {
    return "";
  }
  return sanitizeHttpUrl(value) ?? "";
}

export function createProfileService(
  repos: Repositories,
  clock: Clock,
  entitlements: EntitlementService,
) {
  return {
    async get(userId: string): Promise<BusinessProfile> {
      const record = await repos.profiles.findByUserId(userId);
      return record ? toProfile(record) : EMPTY_PROFILE;
    },

    async update(
      userId: string,
      input: {
        businessName?: unknown;
        name?: unknown;
        email?: unknown;
        phone?: unknown;
        website?: unknown;
        address?: unknown;
        logoUrl?: unknown;
      },
    ): Promise<BusinessProfile> {
      await requireFeature(entitlements, userId, "profile");
      const existing = await repos.profiles.findByUserId(userId);
      const emailRaw = parseOptionalText(
        input.email === undefined ? existing?.email ?? "" : input.email,
        254,
      );
      const phoneRaw = parseOptionalText(
        input.phone === undefined ? existing?.phone ?? "" : input.phone,
        40,
      );
      const websiteRaw = parseOptionalText(
        input.website === undefined ? existing?.website ?? "" : input.website,
        500,
      );

      const record: BusinessProfileRecord = {
        userId,
        businessName: parseOptionalText(
          input.businessName === undefined
            ? existing?.businessName ?? ""
            : input.businessName,
          120,
        ),
        name: parseOptionalText(
          input.name === undefined ? existing?.name ?? "" : input.name,
          120,
        ),
        email: emailRaw ? sanitizeEmail(emailRaw) ?? "" : "",
        phone: phoneRaw ? sanitizePhone(phoneRaw) ?? phoneRaw : "",
        website: websiteRaw ? sanitizeHttpUrl(websiteRaw) ?? "" : "",
        address: parseOptionalText(
          input.address === undefined ? existing?.address ?? "" : input.address,
          400,
        ),
        logoUrl: hostedLogo(
          input.logoUrl === undefined ? existing?.logoUrl ?? "" : input.logoUrl,
        ),
        updatedAt: toIso(clock.now()),
      };
      await repos.profiles.upsert(record);
      return toProfile(record);
    },
  };
}
