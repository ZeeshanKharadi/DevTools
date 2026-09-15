import { sanitizeDestinationUrl } from "../../../lib/pro/destination";
import type { Clock } from "../clock";
import { toIso } from "../clock";
import type { Repositories } from "../db/repositories";
import type { DynamicQrRecord } from "../db/types";
import { HttpError } from "../http";
import {
  copyRecordName,
  createId,
  createPublicCode,
  isUniqueConstraintError,
  parseName,
  parseOptionalFlag,
} from "../ids";
import { requireFeature, type EntitlementService } from "./entitlement";

export type QrListItem = {
  id: string;
  name: string;
  code: string;
  publicUrl: string;
  destinationUrl: string;
  isActive: boolean;
  totalScans: number;
  lastScannedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function publicUrl(base: string, code: string): string {
  return `${base}/q/${code}`;
}

function toItem(record: DynamicQrRecord, publicBaseUrl: string): QrListItem {
  return {
    id: record.id,
    name: record.name,
    code: record.code,
    publicUrl: publicUrl(publicBaseUrl, record.code),
    destinationUrl: record.destinationUrl,
    isActive: record.isActive,
    totalScans: record.totalScans,
    lastScannedAt: record.lastScannedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function ownedQr(
  repos: Repositories,
  userId: string,
  id: string,
): Promise<DynamicQrRecord> {
  const record = await repos.qrCodes.findById(id);
  if (!record || record.userId !== userId) {
    throw new HttpError(404, "not_found", "QR code not found.");
  }
  return record;
}

function parseDestination(raw: unknown): string {
  const url = sanitizeDestinationUrl(raw);
  if (!url) {
    throw new HttpError(
      400,
      "invalid_destination",
      "Enter an http:// or https:// destination URL.",
    );
  }
  return url;
}

async function allocateCode(repos: Repositories): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = createPublicCode(10);
    if (!(await repos.qrCodes.findByCode(code))) {
      return code;
    }
  }
  throw new HttpError(500, "code_generation_failed", "Could not allocate a QR code.");
}

function parseIsActive(raw: unknown, fallback: boolean): boolean {
  const flag = parseOptionalFlag(raw);
  if (flag === null) {
    throw new HttpError(400, "invalid_flag", "isActive must be true or false.");
  }
  return flag ?? fallback;
}

async function insertQr(
  repos: Repositories,
  record: DynamicQrRecord,
): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (attempt > 0) {
      record.code = createPublicCode(10);
    } else if (!record.code) {
      record.code = await allocateCode(repos);
    }

    try {
      await repos.qrCodes.create(record);
      return;
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
    }
  }

  throw new HttpError(500, "code_generation_failed", "Could not allocate a QR code.");
}

export function createQrService(
  repos: Repositories,
  clock: Clock,
  entitlements: EntitlementService,
  publicBaseUrl: string,
) {
  return {
    async list(userId: string): Promise<QrListItem[]> {
      const records = await repos.qrCodes.listByUser(userId);
      return records.map((record) => toItem(record, publicBaseUrl));
    },

    async get(userId: string, id: string): Promise<QrListItem> {
      return toItem(await ownedQr(repos, userId, id), publicBaseUrl);
    },

    async create(
      userId: string,
      input: { name?: unknown; destinationUrl?: unknown; isActive?: unknown },
    ): Promise<QrListItem> {
      await requireFeature(entitlements, userId, "dynamic_qr");
      const name = parseName(input.name);
      if (!name) {
        throw new HttpError(400, "invalid_name", "Enter a name for this QR code.");
      }

      const destinationUrl = parseDestination(input.destinationUrl);
      const now = toIso(clock.now());
      const record: DynamicQrRecord = {
        id: createId(),
        userId,
        name,
        code: await allocateCode(repos),
        destinationUrl,
        isActive: parseIsActive(input.isActive, true),
        totalScans: 0,
        lastScannedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      await insertQr(repos, record);
      return toItem(record, publicBaseUrl);
    },

    async update(
      userId: string,
      id: string,
      input: { name?: unknown; destinationUrl?: unknown; isActive?: unknown },
    ): Promise<QrListItem> {
      await requireFeature(entitlements, userId, "dynamic_qr");
      const existing = await ownedQr(repos, userId, id);
      const name =
        input.name === undefined ? existing.name : parseName(input.name);
      if (!name) {
        throw new HttpError(400, "invalid_name", "Enter a name for this QR code.");
      }

      const destinationUrl =
        input.destinationUrl === undefined
          ? existing.destinationUrl
          : parseDestination(input.destinationUrl);

      const updated: DynamicQrRecord = {
        ...existing,
        name,
        destinationUrl,
        isActive: parseIsActive(input.isActive, existing.isActive),
        updatedAt: toIso(clock.now()),
      };
      await repos.qrCodes.update(updated);
      return toItem(updated, publicBaseUrl);
    },

    async duplicate(userId: string, id: string): Promise<QrListItem> {
      await requireFeature(entitlements, userId, "dynamic_qr");
      const existing = await ownedQr(repos, userId, id);
      const now = toIso(clock.now());
      const copy: DynamicQrRecord = {
        id: createId(),
        userId,
        name: copyRecordName(existing.name),
        code: await allocateCode(repos),
        destinationUrl: existing.destinationUrl,
        isActive: existing.isActive,
        totalScans: 0,
        lastScannedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      await insertQr(repos, copy);
      return toItem(copy, publicBaseUrl);
    },

    async delete(userId: string, id: string): Promise<void> {
      await requireFeature(entitlements, userId, "dynamic_qr");
      await ownedQr(repos, userId, id);
      await repos.qrCodes.delete(id, userId);
    },

    /**
     * Public redirect. `total_scans` / `last_scanned_at` are the dashboard
     * counters. `qr_scan_events` is best-effort analytics and may lag.
     * Analytics failures must not block a valid redirect.
     */
    async resolveRedirect(code: string): Promise<
      | { status: "redirect"; url: string }
      | { status: "inactive" }
      | { status: "missing" }
    > {
      const record = await repos.qrCodes.findByCode(code);
      if (!record) {
        return { status: "missing" };
      }
      if (!record.isActive) {
        return { status: "inactive" };
      }

      const url = sanitizeDestinationUrl(record.destinationUrl);
      if (!url) {
        return { status: "inactive" };
      }

      try {
        await repos.qrCodes.recordScan(record.id, toIso(clock.now()), createId());
      } catch {
        // Counter and event writes are non-critical for the visitor redirect.
      }

      return { status: "redirect", url };
    },
  };
}
