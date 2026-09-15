import type { Clock } from "../clock";
import { toIso } from "../clock";
import type { Repositories } from "../db/repositories";
import type { CustomerRecord } from "../db/types";
import { HttpError } from "../http";
import { createId, parseName, parseOptionalText } from "../ids";
import { requireFeature, type EntitlementService } from "./entitlement";

export type CustomerDetail = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  createdAt: string;
  updatedAt: string;
};

function toDetail(record: CustomerRecord): CustomerDetail {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone,
    company: record.company,
    address: record.address,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function ownedCustomer(
  repos: Repositories,
  userId: string,
  id: string,
): Promise<CustomerRecord> {
  const record = await repos.customers.findById(id);
  if (!record || record.userId !== userId) {
    throw new HttpError(404, "not_found", "Customer not found.");
  }
  return record;
}

function fieldsFrom(input: {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  company?: unknown;
  address?: unknown;
}): Omit<CustomerRecord, "id" | "userId" | "createdAt" | "updatedAt"> {
  const name = parseName(input.name, 120);
  if (!name) {
    throw new HttpError(400, "invalid_name", "Enter a customer name.");
  }

  return {
    name,
    email: parseOptionalText(input.email, 254),
    phone: parseOptionalText(input.phone, 40),
    company: parseOptionalText(input.company, 120),
    address: parseOptionalText(input.address, 400),
  };
}

export function createCustomerService(
  repos: Repositories,
  clock: Clock,
  entitlements: EntitlementService,
) {
  return {
    async list(userId: string): Promise<CustomerDetail[]> {
      const records = await repos.customers.listByUser(userId);
      return records.map(toDetail);
    },

    async get(userId: string, id: string): Promise<CustomerDetail> {
      return toDetail(await ownedCustomer(repos, userId, id));
    },

    async create(
      userId: string,
      input: {
        name?: unknown;
        email?: unknown;
        phone?: unknown;
        company?: unknown;
        address?: unknown;
      },
    ): Promise<CustomerDetail> {
      await requireFeature(entitlements, userId, "customers");
      const now = toIso(clock.now());
      const record: CustomerRecord = {
        id: createId(),
        userId,
        ...fieldsFrom(input),
        createdAt: now,
        updatedAt: now,
      };
      await repos.customers.create(record);
      return toDetail(record);
    },

    async update(
      userId: string,
      id: string,
      input: {
        name?: unknown;
        email?: unknown;
        phone?: unknown;
        company?: unknown;
        address?: unknown;
      },
    ): Promise<CustomerDetail> {
      await requireFeature(entitlements, userId, "customers");
      const existing = await ownedCustomer(repos, userId, id);
      const updated: CustomerRecord = {
        ...existing,
        ...fieldsFrom({
          name: input.name === undefined ? existing.name : input.name,
          email: input.email === undefined ? existing.email : input.email,
          phone: input.phone === undefined ? existing.phone : input.phone,
          company: input.company === undefined ? existing.company : input.company,
          address: input.address === undefined ? existing.address : input.address,
        }),
        updatedAt: toIso(clock.now()),
      };
      await repos.customers.update(updated);
      return toDetail(updated);
    },

    async delete(userId: string, id: string): Promise<void> {
      await requireFeature(entitlements, userId, "customers");
      await ownedCustomer(repos, userId, id);
      await repos.customers.delete(id, userId);
    },
  };
}
