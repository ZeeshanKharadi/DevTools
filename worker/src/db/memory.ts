import type {
  BusinessProfileRepository,
  CardRepository,
  CustomerRepository,
  EmailVerificationRepository,
  InvoiceRepository,
  QrCodeRepository,
  RateLimitStore,
  Repositories,
  SessionRepository,
  SignatureRepository,
  UserRepository,
} from "./repositories";
import type {
  BusinessCardRecord,
  BusinessProfileRecord,
  CustomerRecord,
  DynamicQrRecord,
  EmailVerificationRecord,
  InvoiceRecord,
  SessionRecord,
  SignatureRecord,
  UserRecord,
} from "./types";

function matchesInvoiceQuery(record: InvoiceRecord, query?: string): boolean {
  const needle = query?.trim().toLowerCase();
  if (!needle) {
    return true;
  }

  return (
    record.invoiceNumber.toLowerCase().includes(needle) ||
    record.status.toLowerCase().includes(needle) ||
    record.invoiceData.toLowerCase().includes(needle)
  );
}

export function createMemoryRepositories(): Repositories {
  const users: UserRecord[] = [];
  const sessions: SessionRecord[] = [];
  const verifications: EmailVerificationRecord[] = [];
  const signatures: SignatureRecord[] = [];
  const cards: BusinessCardRecord[] = [];
  const qrCodes: DynamicQrRecord[] = [];
  const scanEvents: { id: string; qrCodeId: string; scannedAt: string }[] = [];
  const customers: CustomerRecord[] = [];
  const invoices: InvoiceRecord[] = [];
  const profiles: BusinessProfileRecord[] = [];
  const attempts: { action: string; key: string; createdAt: string }[] = [];

  const userRepo: UserRepository = {
    async findByEmail(email) {
      return users.find((user) => user.email === email) ?? null;
    },
    async findById(id) {
      return users.find((user) => user.id === id) ?? null;
    },
    async create(user) {
      if (users.some((existing) => existing.email === user.email)) {
        throw new Error("UNIQUE_EMAIL");
      }
      users.push(user);
    },
    async markEmailVerified(userId, verifiedAt) {
      const user = users.find((item) => item.id === userId);
      if (user && !user.emailVerifiedAt) {
        user.emailVerifiedAt = verifiedAt;
        user.updatedAt = verifiedAt;
      }
    },
  };

  const verificationRepo: EmailVerificationRepository = {
    async create(record) {
      verifications.push(record);
    },
    async findActiveByUserId(userId, nowIso) {
      return (
        verifications
          .filter(
            (item) =>
              item.userId === userId &&
              item.consumedAt === null &&
              item.expiresAt > nowIso,
          )
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0] ?? null
      );
    },
    async findLatestByUserId(userId) {
      return (
        verifications
          .filter((item) => item.userId === userId)
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0] ?? null
      );
    },
    async consume(id, consumedAt) {
      const record = verifications.find((item) => item.id === id);
      if (record && record.consumedAt === null) {
        record.consumedAt = consumedAt;
      }
    },
    async consumeAllForUser(userId, consumedAt) {
      for (const record of verifications) {
        if (record.userId === userId && record.consumedAt === null) {
          record.consumedAt = consumedAt;
        }
      }
    },
    async incrementFailures(id) {
      const record = verifications.find((item) => item.id === id);
      if (!record) {
        return 0;
      }
      record.failedAttempts += 1;
      return record.failedAttempts;
    },
  };

  const sessionRepo: SessionRepository = {
    async create(session) {
      sessions.push(session);
    },
    async findById(id, nowIso) {
      return (
        sessions.find(
          (session) => session.id === id && session.expiresAt > nowIso,
        ) ?? null
      );
    },
    async delete(id) {
      const index = sessions.findIndex((session) => session.id === id);
      if (index >= 0) {
        sessions.splice(index, 1);
      }
    },
    async deleteIfExpired(id, nowIso) {
      const index = sessions.findIndex(
        (session) => session.id === id && session.expiresAt <= nowIso,
      );
      if (index >= 0) {
        sessions.splice(index, 1);
      }
    },
    async deleteExpired(nowIso) {
      for (let i = sessions.length - 1; i >= 0; i -= 1) {
        if (sessions[i].expiresAt <= nowIso) {
          sessions.splice(i, 1);
        }
      }
    },
    async touch(id, lastUsedAt) {
      const session = sessions.find((item) => item.id === id);
      if (session) {
        session.lastUsedAt = lastUsedAt;
      }
    },
  };

  const signatureRepo: SignatureRepository = {
    async listByUser(userId) {
      return signatures
        .filter((item) => item.userId === userId)
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    },
    async findById(id) {
      return signatures.find((item) => item.id === id) ?? null;
    },
    async create(record) {
      signatures.push(record);
    },
    async update(record) {
      const index = signatures.findIndex((item) => item.id === record.id);
      if (index >= 0) {
        signatures[index] = record;
      }
    },
    async delete(id, userId) {
      const index = signatures.findIndex(
        (item) => item.id === id && item.userId === userId,
      );
      if (index < 0) {
        return false;
      }
      signatures.splice(index, 1);
      return true;
    },
    async countByUser(userId) {
      return signatures.filter((item) => item.userId === userId).length;
    },
  };

  const cardRepo: CardRepository = {
    async listByUser(userId) {
      return cards
        .filter((item) => item.userId === userId)
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    },
    async findById(id) {
      return cards.find((item) => item.id === id) ?? null;
    },
    async findBySlug(slug) {
      return cards.find((item) => item.publicSlug === slug) ?? null;
    },
    async create(record) {
      if (cards.some((item) => item.publicSlug === record.publicSlug)) {
        throw new Error("UNIQUE_SLUG");
      }
      cards.push(record);
    },
    async update(record) {
      if (
        cards.some(
          (item) => item.publicSlug === record.publicSlug && item.id !== record.id,
        )
      ) {
        throw new Error("UNIQUE_SLUG");
      }
      const index = cards.findIndex((item) => item.id === record.id);
      if (index >= 0) {
        cards[index] = record;
      }
    },
    async delete(id, userId) {
      const index = cards.findIndex(
        (item) => item.id === id && item.userId === userId,
      );
      if (index < 0) {
        return false;
      }
      cards.splice(index, 1);
      return true;
    },
    async countByUser(userId) {
      return cards.filter((item) => item.userId === userId).length;
    },
  };

  const qrRepo: QrCodeRepository = {
    async listByUser(userId) {
      return qrCodes
        .filter((item) => item.userId === userId)
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    },
    async findById(id) {
      return qrCodes.find((item) => item.id === id) ?? null;
    },
    async findByCode(code) {
      return qrCodes.find((item) => item.code === code) ?? null;
    },
    async create(record) {
      if (qrCodes.some((item) => item.code === record.code)) {
        throw new Error("UNIQUE_CODE");
      }
      qrCodes.push(record);
    },
    async update(record) {
      const index = qrCodes.findIndex((item) => item.id === record.id);
      if (index >= 0) {
        qrCodes[index] = record;
      }
    },
    async delete(id, userId) {
      const index = qrCodes.findIndex(
        (item) => item.id === id && item.userId === userId,
      );
      if (index < 0) {
        return false;
      }
      qrCodes.splice(index, 1);
      for (let i = scanEvents.length - 1; i >= 0; i -= 1) {
        if (scanEvents[i].qrCodeId === id) {
          scanEvents.splice(i, 1);
        }
      }
      return true;
    },
    async countActiveByUser(userId) {
      return qrCodes.filter((item) => item.userId === userId && item.isActive).length;
    },
    async recordScan(id, scannedAt, eventId) {
      const record = qrCodes.find((item) => item.id === id);
      if (!record) {
        return;
      }
      record.totalScans += 1;
      record.lastScannedAt = scannedAt;
      scanEvents.push({ id: eventId, qrCodeId: id, scannedAt });
    },
  };

  const customerRepo: CustomerRepository = {
    async listByUser(userId) {
      return customers
        .filter((item) => item.userId === userId)
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    },
    async findById(id) {
      return customers.find((item) => item.id === id) ?? null;
    },
    async create(record) {
      customers.push(record);
    },
    async update(record) {
      const index = customers.findIndex((item) => item.id === record.id);
      if (index >= 0) {
        customers[index] = record;
      }
    },
    async delete(id, userId) {
      const index = customers.findIndex(
        (item) => item.id === id && item.userId === userId,
      );
      if (index < 0) {
        return false;
      }
      customers.splice(index, 1);
      return true;
    },
  };

  const invoiceRepo: InvoiceRepository = {
    async listByUser(userId, query) {
      return invoices
        .filter((item) => item.userId === userId && matchesInvoiceQuery(item, query))
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    },
    async findById(id) {
      return invoices.find((item) => item.id === id) ?? null;
    },
    async create(record) {
      invoices.push(record);
    },
    async update(record) {
      const index = invoices.findIndex((item) => item.id === record.id);
      if (index >= 0) {
        invoices[index] = record;
      }
    },
    async delete(id, userId) {
      const index = invoices.findIndex(
        (item) => item.id === id && item.userId === userId,
      );
      if (index < 0) {
        return false;
      }
      invoices.splice(index, 1);
      return true;
    },
    async countByUser(userId) {
      return invoices.filter((item) => item.userId === userId).length;
    },
  };

  const profileRepo: BusinessProfileRepository = {
    async findByUserId(userId) {
      return profiles.find((item) => item.userId === userId) ?? null;
    },
    async upsert(record) {
      const index = profiles.findIndex((item) => item.userId === record.userId);
      if (index >= 0) {
        profiles[index] = record;
      } else {
        profiles.push(record);
      }
    },
  };

  const rateLimits: RateLimitStore = {
    async hit(action, key, nowIso, windowMs) {
      const cutoff = new Date(new Date(nowIso).getTime() - windowMs).toISOString();
      const recent = attempts.filter(
        (attempt) =>
          attempt.action === action &&
          attempt.key === key &&
          attempt.createdAt >= cutoff,
      );
      attempts.push({ action, key, createdAt: nowIso });
      return recent.length + 1;
    },
  };

  return {
    users: userRepo,
    sessions: sessionRepo,
    verifications: verificationRepo,
    signatures: signatureRepo,
    cards: cardRepo,
    qrCodes: qrRepo,
    customers: customerRepo,
    invoices: invoiceRepo,
    profiles: profileRepo,
    rateLimits,
  };
}
