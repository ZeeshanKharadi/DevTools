import {
  parseSignatureName,
  parseStoredSignatureInput,
} from "../../../lib/tools/email-signature-generator/stored";
import type { SignatureInput } from "../../../lib/tools/email-signature-generator/types";
import type { Clock } from "../clock";
import { toIso } from "../clock";
import type { Repositories } from "../db/repositories";
import type { SignatureRecord } from "../db/types";
import { createId } from "../ids";
import { requireFeature, type EntitlementService, createBetaEntitlementService } from "./entitlement";

export class SignatureError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "SignatureError";
  }
}

export type SignatureListItem = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type SignatureDetail = SignatureListItem & {
  data: SignatureInput;
  warnings: string[];
};

function toListItem(record: SignatureRecord): SignatureListItem {
  return {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function parseRecord(record: SignatureRecord): SignatureDetail {
  let parsed: unknown;
  try {
    parsed = JSON.parse(record.signatureData);
  } catch {
    throw new SignatureError(500, "corrupt_signature", "Saved signature data is invalid.");
  }

  const result = parseStoredSignatureInput(parsed);
  if (!result.ok) {
    throw new SignatureError(500, "corrupt_signature", result.message);
  }

  return {
    ...toListItem(record),
    data: result.data,
    warnings: result.warnings,
  };
}

async function ownedSignature(
  repos: Repositories,
  userId: string,
  id: string,
): Promise<SignatureRecord> {
  const record = await repos.signatures.findById(id);
  if (!record || record.userId !== userId) {
    throw new SignatureError(404, "not_found", "Signature not found.");
  }

  return record;
}

export function createSignatureService(
  repos: Repositories,
  clock: Clock,
  entitlements: EntitlementService = createBetaEntitlementService(),
) {
  return {
    async list(userId: string): Promise<SignatureListItem[]> {
      const records = await repos.signatures.listByUser(userId);
      return records.map(toListItem);
    },

    async get(userId: string, id: string): Promise<SignatureDetail> {
      return parseRecord(await ownedSignature(repos, userId, id));
    },

    async create(
      userId: string,
      input: { name?: unknown; data?: unknown },
    ): Promise<SignatureDetail> {
      await requireFeature(entitlements, userId, "signatures");
      const name = parseSignatureName(input.name);
      if (!name) {
        throw new SignatureError(400, "invalid_name", "Enter a name for this signature.");
      }

      const parsed = parseStoredSignatureInput(input.data);
      if (!parsed.ok) {
        throw new SignatureError(400, "invalid_signature", parsed.message);
      }

      const now = toIso(clock.now());
      const record: SignatureRecord = {
        id: createId(),
        userId,
        name,
        signatureData: JSON.stringify(parsed.data),
        createdAt: now,
        updatedAt: now,
      };
      await repos.signatures.create(record);
      return {
        ...parseRecord(record),
        warnings: parsed.warnings,
      };
    },

    async update(
      userId: string,
      id: string,
      input: { name?: unknown; data?: unknown },
    ): Promise<SignatureDetail> {
      await requireFeature(entitlements, userId, "signatures");
      const existing = await ownedSignature(repos, userId, id);
      const name =
        input.name === undefined
          ? existing.name
          : parseSignatureName(input.name);
      if (!name) {
        throw new SignatureError(400, "invalid_name", "Enter a name for this signature.");
      }

      let dataJson = existing.signatureData;
      let warnings: string[] = [];
      if (input.data !== undefined) {
        const parsed = parseStoredSignatureInput(input.data);
        if (!parsed.ok) {
          throw new SignatureError(400, "invalid_signature", parsed.message);
        }
        dataJson = JSON.stringify(parsed.data);
        warnings = parsed.warnings;
      }

      const updated: SignatureRecord = {
        ...existing,
        name,
        signatureData: dataJson,
        updatedAt: toIso(clock.now()),
      };
      await repos.signatures.update(updated);
      return {
        ...parseRecord(updated),
        warnings,
      };
    },

    async duplicate(userId: string, id: string): Promise<SignatureDetail> {
      await requireFeature(entitlements, userId, "signatures");
      const existing = await ownedSignature(repos, userId, id);
      const now = toIso(clock.now());
      const copy: SignatureRecord = {
        id: createId(),
        userId,
        name: existing.name.startsWith("Copy of ")
          ? existing.name
          : `Copy of ${existing.name}`.slice(0, 80),
        signatureData: existing.signatureData,
        createdAt: now,
        updatedAt: now,
      };
      await repos.signatures.create(copy);
      return parseRecord(copy);
    },

    async delete(userId: string, id: string): Promise<void> {
      await requireFeature(entitlements, userId, "signatures");
      await ownedSignature(repos, userId, id);
      await repos.signatures.delete(id, userId);
    },
  };
}
