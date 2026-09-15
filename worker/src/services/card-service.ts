import { parseStoredCardInput } from "../../../lib/tools/digital-business-card/stored";
import type { CardInput } from "../../../lib/tools/digital-business-card/types";
import type { Clock } from "../clock";
import { toIso } from "../clock";
import type { Repositories } from "../db/repositories";
import type { BusinessCardRecord } from "../db/types";
import { HttpError } from "../http";
import {
  copyRecordName,
  createId,
  createPublicCode,
  isUniqueConstraintError,
  parseName,
  parseOptionalFlag,
  parseSlug,
  slugifyName,
} from "../ids";
import { requireFeature, type EntitlementService } from "./entitlement";

export type CardListItem = {
  id: string;
  name: string;
  publicSlug: string;
  publicUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CardDetail = CardListItem & {
  data: CardInput;
  warnings: string[];
};

function publicUrl(base: string, slug: string): string {
  return `${base}/card/${slug}`;
}

function toListItem(record: BusinessCardRecord, publicBaseUrl: string): CardListItem {
  return {
    id: record.id,
    name: record.name,
    publicSlug: record.publicSlug,
    publicUrl: publicUrl(publicBaseUrl, record.publicSlug),
    isActive: record.isActive,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function parseRecord(record: BusinessCardRecord, publicBaseUrl: string): CardDetail {
  let parsed: unknown;
  try {
    parsed = JSON.parse(record.cardData);
  } catch {
    throw new HttpError(500, "corrupt_card", "Saved card data is invalid.");
  }

  const result = parseStoredCardInput(parsed);
  if (!result.ok) {
    throw new HttpError(500, "corrupt_card", result.message);
  }

  return {
    ...toListItem(record, publicBaseUrl),
    data: result.data,
    warnings: result.warnings,
  };
}

async function ownedCard(
  repos: Repositories,
  userId: string,
  id: string,
): Promise<BusinessCardRecord> {
  const record = await repos.cards.findById(id);
  if (!record || record.userId !== userId) {
    throw new HttpError(404, "not_found", "Card not found.");
  }
  return record;
}

function parseIsActive(raw: unknown, fallback: boolean): boolean {
  const flag = parseOptionalFlag(raw);
  if (flag === null) {
    throw new HttpError(400, "invalid_flag", "isActive must be true or false.");
  }
  return flag ?? fallback;
}

async function insertCard(
  repos: Repositories,
  record: BusinessCardRecord,
  requestedSlug: string | null,
): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (attempt > 0) {
      if (requestedSlug) {
        throw new HttpError(409, "slug_taken", "That public URL is already in use.");
      }
      record.publicSlug = `${slugifyName(record.name).slice(0, 28)}-${createPublicCode(4)}`;
    }

    try {
      await repos.cards.create(record);
      return;
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
      if (requestedSlug) {
        throw new HttpError(409, "slug_taken", "That public URL is already in use.");
      }
    }
  }

  throw new HttpError(500, "slug_generation_failed", "Could not allocate a public URL.");
}

async function allocateSlug(
  repos: Repositories,
  name: string,
  requested: string | null,
  excludeId?: string,
): Promise<string> {
  if (requested) {
    const existing = await repos.cards.findBySlug(requested);
    if (existing && existing.id !== excludeId) {
      throw new HttpError(409, "slug_taken", "That public URL is already in use.");
    }
    return requested;
  }

  let candidate = slugifyName(name);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const existing = await repos.cards.findBySlug(candidate);
    if (!existing || existing.id === excludeId) {
      return candidate;
    }
    candidate = `${slugifyName(name).slice(0, 28)}-${createPublicCode(4)}`;
  }

  throw new HttpError(500, "slug_generation_failed", "Could not allocate a public URL.");
}

export function createCardService(
  repos: Repositories,
  clock: Clock,
  entitlements: EntitlementService,
  publicBaseUrl: string,
) {
  return {
    async list(userId: string): Promise<CardListItem[]> {
      const records = await repos.cards.listByUser(userId);
      return records.map((record) => toListItem(record, publicBaseUrl));
    },

    async get(userId: string, id: string): Promise<CardDetail> {
      return parseRecord(await ownedCard(repos, userId, id), publicBaseUrl);
    },

    async create(
      userId: string,
      input: { name?: unknown; slug?: unknown; data?: unknown; isActive?: unknown },
    ): Promise<CardDetail> {
      await requireFeature(entitlements, userId, "cards");
      const name = parseName(input.name);
      if (!name) {
        throw new HttpError(400, "invalid_name", "Enter a name for this card.");
      }

      const parsed = parseStoredCardInput(input.data);
      if (!parsed.ok) {
        throw new HttpError(400, "invalid_card", parsed.message);
      }

      const requestedSlug = parseSlug(input.slug);
      const slug = await allocateSlug(repos, name, requestedSlug);
      const now = toIso(clock.now());
      const record: BusinessCardRecord = {
        id: createId(),
        userId,
        name,
        publicSlug: slug,
        isActive: parseIsActive(input.isActive, true),
        cardData: JSON.stringify(parsed.data),
        createdAt: now,
        updatedAt: now,
      };

      await insertCard(repos, record, requestedSlug);

      return {
        ...parseRecord(record, publicBaseUrl),
        warnings: parsed.warnings,
      };
    },

    async update(
      userId: string,
      id: string,
      input: { name?: unknown; slug?: unknown; data?: unknown; isActive?: unknown },
    ): Promise<CardDetail> {
      await requireFeature(entitlements, userId, "cards");
      const existing = await ownedCard(repos, userId, id);
      const name =
        input.name === undefined ? existing.name : parseName(input.name);
      if (!name) {
        throw new HttpError(400, "invalid_name", "Enter a name for this card.");
      }

      const requestedSlug =
        input.slug === undefined ? existing.publicSlug : parseSlug(input.slug);
      if (input.slug !== undefined && !requestedSlug) {
        throw new HttpError(
          400,
          "invalid_slug",
          "Use 3–40 lowercase letters, numbers, and hyphens.",
        );
      }

      const slug = await allocateSlug(
        repos,
        name,
        requestedSlug === existing.publicSlug ? requestedSlug : requestedSlug,
        existing.id,
      );

      let dataJson = existing.cardData;
      let warnings: string[] = [];
      if (input.data !== undefined) {
        const parsed = parseStoredCardInput(input.data);
        if (!parsed.ok) {
          throw new HttpError(400, "invalid_card", parsed.message);
        }
        dataJson = JSON.stringify(parsed.data);
        warnings = parsed.warnings;
      }

      const updated: BusinessCardRecord = {
        ...existing,
        name,
        publicSlug: slug,
        isActive: parseIsActive(input.isActive, existing.isActive),
        cardData: dataJson,
        updatedAt: toIso(clock.now()),
      };

      try {
        await repos.cards.update(updated);
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          throw new HttpError(409, "slug_taken", "That public URL is already in use.");
        }
        throw error;
      }

      return {
        ...parseRecord(updated, publicBaseUrl),
        warnings,
      };
    },

    async duplicate(userId: string, id: string): Promise<CardDetail> {
      await requireFeature(entitlements, userId, "cards");
      const existing = await ownedCard(repos, userId, id);
      const name = copyRecordName(existing.name);
      const slug = await allocateSlug(repos, name, null);
      const now = toIso(clock.now());
      const copy: BusinessCardRecord = {
        id: createId(),
        userId,
        name,
        publicSlug: slug,
        isActive: existing.isActive,
        cardData: existing.cardData,
        createdAt: now,
        updatedAt: now,
      };
      await insertCard(repos, copy, null);
      return parseRecord(copy, publicBaseUrl);
    },

    async delete(userId: string, id: string): Promise<void> {
      await requireFeature(entitlements, userId, "cards");
      await ownedCard(repos, userId, id);
      await repos.cards.delete(id, userId);
    },

    async getPublicBySlug(slug: string): Promise<CardDetail | null> {
      const normalized = parseSlug(slug);
      if (!normalized) {
        return null;
      }
      const record = await repos.cards.findBySlug(normalized);
      if (!record || !record.isActive) {
        return null;
      }
      return parseRecord(record, publicBaseUrl);
    },
  };
}
