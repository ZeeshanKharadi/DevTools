import type {
  BusinessProfileRepository,
  CardRepository,
  CustomerRepository,
  EmailVerificationRepository,
  InvoiceRepository,
  PasswordResetRepository,
  ProcessedStripeEventRepository,
  QrCodeRepository,
  RateLimitStore,
  Repositories,
  SessionRepository,
  SignatureRepository,
  SubscriptionRepository,
  UserRepository,
} from "./repositories";
import type {
  BusinessCardRecord,
  BusinessProfileRecord,
  CustomerRecord,
  DynamicQrRecord,
  EmailVerificationRecord,
  InvoiceRecord,
  PasswordResetRecord,
  SessionRecord,
  SignatureRecord,
  SubscriptionRecord,
  UserRecord,
} from "./types";

type D1DatabaseLike = {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first<T = Record<string, unknown>>(): Promise<T | null>;
      run(): Promise<unknown>;
      all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
    };
  };
};

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  email_verified_at: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
};

type VerificationRow = {
  id: string;
  user_id: string;
  otp_hash: string;
  expires_at: string;
  consumed_at: string | null;
  failed_attempts: number;
  created_at: string;
};

type PasswordResetRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: number;
  created_at: string;
  updated_at: string;
};

type SessionRow = {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
  last_used_at: string;
};

type SignatureRow = {
  id: string;
  user_id: string;
  name: string;
  signature_data: string;
  created_at: string;
  updated_at: string;
};

type CardRow = {
  id: string;
  user_id: string;
  name: string;
  public_slug: string;
  is_active: number;
  card_data: string;
  created_at: string;
  updated_at: string;
};

type QrRow = {
  id: string;
  user_id: string;
  name: string;
  code: string;
  destination_url: string;
  is_active: number;
  total_scans: number;
  last_scanned_at: string | null;
  created_at: string;
  updated_at: string;
};

type CustomerRow = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  created_at: string;
  updated_at: string;
};

type InvoiceRow = {
  id: string;
  user_id: string;
  invoice_number: string;
  status: string;
  currency: string;
  invoice_data: string;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  user_id: string;
  business_name: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  logo_url: string;
  updated_at: string;
};

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    emailVerifiedAt: row.email_verified_at,
    stripeCustomerId: row.stripe_customer_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVerification(row: VerificationRow): EmailVerificationRecord {
  return {
    id: row.id,
    userId: row.user_id,
    otpHash: row.otp_hash,
    expiresAt: row.expires_at,
    consumedAt: row.consumed_at,
    failedAttempts: Number(row.failed_attempts ?? 0),
    createdAt: row.created_at,
  };
}

function mapPasswordReset(row: PasswordResetRow): PasswordResetRecord {
  return {
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    consumedAt: row.consumed_at,
    createdAt: row.created_at,
  };
}

function mapSubscription(row: SubscriptionRow): SubscriptionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripePriceId: row.stripe_price_id,
    status: row.status,
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSession(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  };
}

function mapSignature(row: SignatureRow): SignatureRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    signatureData: row.signature_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCard(row: CardRow): BusinessCardRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    publicSlug: row.public_slug,
    isActive: row.is_active === 1,
    cardData: row.card_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapQr(row: QrRow): DynamicQrRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    code: row.code,
    destinationUrl: row.destination_url,
    isActive: row.is_active === 1,
    totalScans: Number(row.total_scans ?? 0),
    lastScannedAt: row.last_scanned_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCustomer(row: CustomerRow): CustomerRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    address: row.address,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInvoice(row: InvoiceRow): InvoiceRecord {
  return {
    id: row.id,
    userId: row.user_id,
    invoiceNumber: row.invoice_number,
    status: row.status,
    currency: row.currency,
    invoiceData: row.invoice_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProfile(row: ProfileRow): BusinessProfileRecord {
  return {
    userId: row.user_id,
    businessName: row.business_name,
    name: row.name,
    email: row.email,
    phone: row.phone,
    website: row.website,
    address: row.address,
    logoUrl: row.logo_url,
    updatedAt: row.updated_at,
  };
}

function likeContains(query?: string): string | null {
  const needle = query?.trim();
  if (!needle) {
    return null;
  }
  return `%${needle.replace(/[%_]/g, "")}%`;
}

export function createD1Repositories(db: D1DatabaseLike): Repositories {
  const users: UserRepository = {
    async findByEmail(email) {
      const row = await db
        .prepare(
          "SELECT id, email, password_hash, email_verified_at, stripe_customer_id, created_at, updated_at FROM users WHERE email = ? LIMIT 1",
        )
        .bind(email)
        .first<UserRow>();
      return row ? mapUser(row) : null;
    },
    async findById(id) {
      const row = await db
        .prepare(
          "SELECT id, email, password_hash, email_verified_at, stripe_customer_id, created_at, updated_at FROM users WHERE id = ? LIMIT 1",
        )
        .bind(id)
        .first<UserRow>();
      return row ? mapUser(row) : null;
    },
    async findByStripeCustomerId(stripeCustomerId) {
      const row = await db
        .prepare(
          "SELECT id, email, password_hash, email_verified_at, stripe_customer_id, created_at, updated_at FROM users WHERE stripe_customer_id = ? LIMIT 1",
        )
        .bind(stripeCustomerId)
        .first<UserRow>();
      return row ? mapUser(row) : null;
    },
    async create(user) {
      try {
        await db
          .prepare(
            "INSERT INTO users (id, email, password_hash, email_verified_at, stripe_customer_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
          )
          .bind(
            user.id,
            user.email,
            user.passwordHash,
            user.emailVerifiedAt,
            user.stripeCustomerId,
            user.createdAt,
            user.updatedAt,
          )
          .run();
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message.includes("UNIQUE") || message.includes("unique")) {
          throw new Error("UNIQUE_EMAIL");
        }
        throw error;
      }
    },
    async markEmailVerified(userId, verifiedAt) {
      await db
        .prepare(
          "UPDATE users SET email_verified_at = ?, updated_at = ? WHERE id = ? AND email_verified_at IS NULL",
        )
        .bind(verifiedAt, verifiedAt, userId)
        .run();
    },
    async updatePassword(userId, passwordHash, updatedAt) {
      await db
        .prepare(
          "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
        )
        .bind(passwordHash, updatedAt, userId)
        .run();
    },
    async setStripeCustomerId(userId, stripeCustomerId) {
      await db
        .prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?")
        .bind(stripeCustomerId, userId)
        .run();
    },
  };

  const verifications: EmailVerificationRepository = {
    async create(record) {
      await db
        .prepare(
          "INSERT INTO email_verification_challenges (id, user_id, otp_hash, expires_at, consumed_at, failed_attempts, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          record.id,
          record.userId,
          record.otpHash,
          record.expiresAt,
          record.consumedAt,
          record.failedAttempts,
          record.createdAt,
        )
        .run();
    },
    async findActiveByUserId(userId, nowIso) {
      const row = await db
        .prepare(
          "SELECT id, user_id, otp_hash, expires_at, consumed_at, failed_attempts, created_at FROM email_verification_challenges WHERE user_id = ? AND consumed_at IS NULL AND expires_at > ? ORDER BY created_at DESC LIMIT 1",
        )
        .bind(userId, nowIso)
        .first<VerificationRow>();
      return row ? mapVerification(row) : null;
    },
    async findLatestByUserId(userId) {
      const row = await db
        .prepare(
          "SELECT id, user_id, otp_hash, expires_at, consumed_at, failed_attempts, created_at FROM email_verification_challenges WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
        )
        .bind(userId)
        .first<VerificationRow>();
      return row ? mapVerification(row) : null;
    },
    async consume(id, consumedAt) {
      await db
        .prepare(
          "UPDATE email_verification_challenges SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL",
        )
        .bind(consumedAt, id)
        .run();
    },
    async consumeAllForUser(userId, consumedAt) {
      await db
        .prepare(
          "UPDATE email_verification_challenges SET consumed_at = ? WHERE user_id = ? AND consumed_at IS NULL",
        )
        .bind(consumedAt, userId)
        .run();
    },
    async incrementFailures(id) {
      await db
        .prepare(
          "UPDATE email_verification_challenges SET failed_attempts = failed_attempts + 1 WHERE id = ?",
        )
        .bind(id)
        .run();
      const row = await db
        .prepare(
          "SELECT failed_attempts FROM email_verification_challenges WHERE id = ? LIMIT 1",
        )
        .bind(id)
        .first<{ failed_attempts: number }>();
      return Number(row?.failed_attempts ?? 0);
    },
  };

  const passwordResets: PasswordResetRepository = {
    async create(record) {
      await db
        .prepare(
          "INSERT INTO password_reset_challenges (id, user_id, token_hash, expires_at, consumed_at, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(
          record.id,
          record.userId,
          record.tokenHash,
          record.expiresAt,
          record.consumedAt,
          record.createdAt,
        )
        .run();
    },
    async findActiveByTokenHash(tokenHash, nowIso) {
      const row = await db
        .prepare(
          "SELECT id, user_id, token_hash, expires_at, consumed_at, created_at FROM password_reset_challenges WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > ? LIMIT 1",
        )
        .bind(tokenHash, nowIso)
        .first<PasswordResetRow>();
      return row ? mapPasswordReset(row) : null;
    },
    async consume(id, consumedAt) {
      await db
        .prepare(
          "UPDATE password_reset_challenges SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL",
        )
        .bind(consumedAt, id)
        .run();
    },
    async consumeAllForUser(userId, consumedAt) {
      await db
        .prepare(
          "UPDATE password_reset_challenges SET consumed_at = ? WHERE user_id = ? AND consumed_at IS NULL",
        )
        .bind(consumedAt, userId)
        .run();
    },
  };

  const sessions: SessionRepository = {
    async create(session) {
      await db
        .prepare(
          "INSERT INTO sessions (id, user_id, expires_at, created_at, last_used_at) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(
          session.id,
          session.userId,
          session.expiresAt,
          session.createdAt,
          session.lastUsedAt,
        )
        .run();
    },
    async findById(id, nowIso) {
      const row = await db
        .prepare(
          "SELECT id, user_id, expires_at, created_at, last_used_at FROM sessions WHERE id = ? AND expires_at > ? LIMIT 1",
        )
        .bind(id, nowIso)
        .first<SessionRow>();
      return row ? mapSession(row) : null;
    },
    async delete(id) {
      await db.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
    },
    async deleteByUserId(userId) {
      await db
        .prepare("DELETE FROM sessions WHERE user_id = ?")
        .bind(userId)
        .run();
    },
    async deleteIfExpired(id, nowIso) {
      await db
        .prepare("DELETE FROM sessions WHERE id = ? AND expires_at <= ?")
        .bind(id, nowIso)
        .run();
    },
    async deleteExpired(nowIso) {
      await db
        .prepare("DELETE FROM sessions WHERE expires_at <= ?")
        .bind(nowIso)
        .run();
    },
    async touch(id, lastUsedAt) {
      await db
        .prepare("UPDATE sessions SET last_used_at = ? WHERE id = ?")
        .bind(lastUsedAt, id)
        .run();
    },
  };

  const signatures: SignatureRepository = {
    async listByUser(userId) {
      const result = await db
        .prepare(
          "SELECT id, user_id, name, signature_data, created_at, updated_at FROM email_signatures WHERE user_id = ? ORDER BY updated_at DESC",
        )
        .bind(userId)
        .all<SignatureRow>();
      return result.results.map(mapSignature);
    },
    async findById(id) {
      const row = await db
        .prepare(
          "SELECT id, user_id, name, signature_data, created_at, updated_at FROM email_signatures WHERE id = ? LIMIT 1",
        )
        .bind(id)
        .first<SignatureRow>();
      return row ? mapSignature(row) : null;
    },
    async create(record) {
      await db
        .prepare(
          "INSERT INTO email_signatures (id, name, user_id, signature_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(
          record.id,
          record.name,
          record.userId,
          record.signatureData,
          record.createdAt,
          record.updatedAt,
        )
        .run();
    },
    async update(record) {
      await db
        .prepare(
          "UPDATE email_signatures SET name = ?, signature_data = ?, updated_at = ? WHERE id = ? AND user_id = ?",
        )
        .bind(
          record.name,
          record.signatureData,
          record.updatedAt,
          record.id,
          record.userId,
        )
        .run();
    },
    async delete(id, userId) {
      const existing = await db
        .prepare("SELECT id FROM email_signatures WHERE id = ? AND user_id = ? LIMIT 1")
        .bind(id, userId)
        .first<{ id: string }>();
      if (!existing) {
        return false;
      }
      await db
        .prepare("DELETE FROM email_signatures WHERE id = ? AND user_id = ?")
        .bind(id, userId)
        .run();
      return true;
    },
    async countByUser(userId) {
      const row = await db
        .prepare("SELECT COUNT(*) AS count FROM email_signatures WHERE user_id = ?")
        .bind(userId)
        .first<{ count: number }>();
      return Number(row?.count ?? 0);
    },
  };

  const cards: CardRepository = {
    async listByUser(userId) {
      const result = await db
        .prepare(
          "SELECT id, user_id, name, public_slug, is_active, card_data, created_at, updated_at FROM business_cards WHERE user_id = ? ORDER BY updated_at DESC",
        )
        .bind(userId)
        .all<CardRow>();
      return result.results.map(mapCard);
    },
    async findById(id) {
      const row = await db
        .prepare(
          "SELECT id, user_id, name, public_slug, is_active, card_data, created_at, updated_at FROM business_cards WHERE id = ? LIMIT 1",
        )
        .bind(id)
        .first<CardRow>();
      return row ? mapCard(row) : null;
    },
    async findBySlug(slug) {
      const row = await db
        .prepare(
          "SELECT id, user_id, name, public_slug, is_active, card_data, created_at, updated_at FROM business_cards WHERE public_slug = ? LIMIT 1",
        )
        .bind(slug)
        .first<CardRow>();
      return row ? mapCard(row) : null;
    },
    async create(record) {
      await db
        .prepare(
          "INSERT INTO business_cards (id, user_id, name, public_slug, is_active, card_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          record.id,
          record.userId,
          record.name,
          record.publicSlug,
          record.isActive ? 1 : 0,
          record.cardData,
          record.createdAt,
          record.updatedAt,
        )
        .run();
    },
    async update(record) {
      await db
        .prepare(
          "UPDATE business_cards SET name = ?, public_slug = ?, is_active = ?, card_data = ?, updated_at = ? WHERE id = ? AND user_id = ?",
        )
        .bind(
          record.name,
          record.publicSlug,
          record.isActive ? 1 : 0,
          record.cardData,
          record.updatedAt,
          record.id,
          record.userId,
        )
        .run();
    },
    async delete(id, userId) {
      const existing = await db
        .prepare("SELECT id FROM business_cards WHERE id = ? AND user_id = ? LIMIT 1")
        .bind(id, userId)
        .first<{ id: string }>();
      if (!existing) {
        return false;
      }
      await db
        .prepare("DELETE FROM business_cards WHERE id = ? AND user_id = ?")
        .bind(id, userId)
        .run();
      return true;
    },
    async countByUser(userId) {
      const row = await db
        .prepare("SELECT COUNT(*) AS count FROM business_cards WHERE user_id = ?")
        .bind(userId)
        .first<{ count: number }>();
      return Number(row?.count ?? 0);
    },
  };

  const qrCodes: QrCodeRepository = {
    async listByUser(userId) {
      const result = await db
        .prepare(
          "SELECT id, user_id, name, code, destination_url, is_active, total_scans, last_scanned_at, created_at, updated_at FROM dynamic_qr_codes WHERE user_id = ? ORDER BY updated_at DESC",
        )
        .bind(userId)
        .all<QrRow>();
      return result.results.map(mapQr);
    },
    async findById(id) {
      const row = await db
        .prepare(
          "SELECT id, user_id, name, code, destination_url, is_active, total_scans, last_scanned_at, created_at, updated_at FROM dynamic_qr_codes WHERE id = ? LIMIT 1",
        )
        .bind(id)
        .first<QrRow>();
      return row ? mapQr(row) : null;
    },
    async findByCode(code) {
      const row = await db
        .prepare(
          "SELECT id, user_id, name, code, destination_url, is_active, total_scans, last_scanned_at, created_at, updated_at FROM dynamic_qr_codes WHERE code = ? LIMIT 1",
        )
        .bind(code)
        .first<QrRow>();
      return row ? mapQr(row) : null;
    },
    async create(record) {
      await db
        .prepare(
          "INSERT INTO dynamic_qr_codes (id, user_id, name, code, destination_url, is_active, total_scans, last_scanned_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          record.id,
          record.userId,
          record.name,
          record.code,
          record.destinationUrl,
          record.isActive ? 1 : 0,
          record.totalScans,
          record.lastScannedAt,
          record.createdAt,
          record.updatedAt,
        )
        .run();
    },
    async update(record) {
      await db
        .prepare(
          "UPDATE dynamic_qr_codes SET name = ?, destination_url = ?, is_active = ?, updated_at = ? WHERE id = ? AND user_id = ?",
        )
        .bind(
          record.name,
          record.destinationUrl,
          record.isActive ? 1 : 0,
          record.updatedAt,
          record.id,
          record.userId,
        )
        .run();
    },
    async delete(id, userId) {
      const existing = await db
        .prepare("SELECT id FROM dynamic_qr_codes WHERE id = ? AND user_id = ? LIMIT 1")
        .bind(id, userId)
        .first<{ id: string }>();
      if (!existing) {
        return false;
      }
      await db
        .prepare("DELETE FROM dynamic_qr_codes WHERE id = ? AND user_id = ?")
        .bind(id, userId)
        .run();
      return true;
    },
    async countActiveByUser(userId) {
      const row = await db
        .prepare(
          "SELECT COUNT(*) AS count FROM dynamic_qr_codes WHERE user_id = ? AND is_active = 1",
        )
        .bind(userId)
        .first<{ count: number }>();
      return Number(row?.count ?? 0);
    },
    async recordScan(id, scannedAt, eventId) {
      // total_scans is the dashboard source of truth (atomic increment).
      await db
        .prepare(
          "UPDATE dynamic_qr_codes SET total_scans = total_scans + 1, last_scanned_at = ? WHERE id = ?",
        )
        .bind(scannedAt, id)
        .run();
      try {
        await db
          .prepare(
            "INSERT INTO qr_scan_events (id, qr_code_id, scanned_at) VALUES (?, ?, ?)",
          )
          .bind(eventId, id, scannedAt)
          .run();
      } catch {
        // Event rows are optional analytics and may lag behind total_scans.
      }
    },
  };

  const customers: CustomerRepository = {
    async listByUser(userId) {
      const result = await db
        .prepare(
          "SELECT id, user_id, name, email, phone, company, address, created_at, updated_at FROM customers WHERE user_id = ? ORDER BY updated_at DESC",
        )
        .bind(userId)
        .all<CustomerRow>();
      return result.results.map(mapCustomer);
    },
    async findById(id) {
      const row = await db
        .prepare(
          "SELECT id, user_id, name, email, phone, company, address, created_at, updated_at FROM customers WHERE id = ? LIMIT 1",
        )
        .bind(id)
        .first<CustomerRow>();
      return row ? mapCustomer(row) : null;
    },
    async create(record) {
      await db
        .prepare(
          "INSERT INTO customers (id, user_id, name, email, phone, company, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          record.id,
          record.userId,
          record.name,
          record.email,
          record.phone,
          record.company,
          record.address,
          record.createdAt,
          record.updatedAt,
        )
        .run();
    },
    async update(record) {
      await db
        .prepare(
          "UPDATE customers SET name = ?, email = ?, phone = ?, company = ?, address = ?, updated_at = ? WHERE id = ? AND user_id = ?",
        )
        .bind(
          record.name,
          record.email,
          record.phone,
          record.company,
          record.address,
          record.updatedAt,
          record.id,
          record.userId,
        )
        .run();
    },
    async delete(id, userId) {
      const existing = await db
        .prepare("SELECT id FROM customers WHERE id = ? AND user_id = ? LIMIT 1")
        .bind(id, userId)
        .first<{ id: string }>();
      if (!existing) {
        return false;
      }
      await db
        .prepare("DELETE FROM customers WHERE id = ? AND user_id = ?")
        .bind(id, userId)
        .run();
      return true;
    },
  };

  const invoices: InvoiceRepository = {
    async listByUser(userId, query) {
      const like = likeContains(query);
      const result = like
        ? await db
            .prepare(
              "SELECT id, user_id, invoice_number, status, currency, invoice_data, created_at, updated_at FROM invoices WHERE user_id = ? AND (invoice_number LIKE ? OR status LIKE ? OR invoice_data LIKE ?) ORDER BY updated_at DESC",
            )
            .bind(userId, like, like, like)
            .all<InvoiceRow>()
        : await db
            .prepare(
              "SELECT id, user_id, invoice_number, status, currency, invoice_data, created_at, updated_at FROM invoices WHERE user_id = ? ORDER BY updated_at DESC",
            )
            .bind(userId)
            .all<InvoiceRow>();
      return result.results.map(mapInvoice);
    },
    async findById(id) {
      const row = await db
        .prepare(
          "SELECT id, user_id, invoice_number, status, currency, invoice_data, created_at, updated_at FROM invoices WHERE id = ? LIMIT 1",
        )
        .bind(id)
        .first<InvoiceRow>();
      return row ? mapInvoice(row) : null;
    },
    async create(record) {
      await db
        .prepare(
          "INSERT INTO invoices (id, user_id, invoice_number, status, currency, invoice_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          record.id,
          record.userId,
          record.invoiceNumber,
          record.status,
          record.currency,
          record.invoiceData,
          record.createdAt,
          record.updatedAt,
        )
        .run();
    },
    async update(record) {
      await db
        .prepare(
          "UPDATE invoices SET invoice_number = ?, status = ?, currency = ?, invoice_data = ?, updated_at = ? WHERE id = ? AND user_id = ?",
        )
        .bind(
          record.invoiceNumber,
          record.status,
          record.currency,
          record.invoiceData,
          record.updatedAt,
          record.id,
          record.userId,
        )
        .run();
    },
    async delete(id, userId) {
      const existing = await db
        .prepare("SELECT id FROM invoices WHERE id = ? AND user_id = ? LIMIT 1")
        .bind(id, userId)
        .first<{ id: string }>();
      if (!existing) {
        return false;
      }
      await db
        .prepare("DELETE FROM invoices WHERE id = ? AND user_id = ?")
        .bind(id, userId)
        .run();
      return true;
    },
    async countByUser(userId) {
      const row = await db
        .prepare("SELECT COUNT(*) AS count FROM invoices WHERE user_id = ?")
        .bind(userId)
        .first<{ count: number }>();
      return Number(row?.count ?? 0);
    },
  };

  const profiles: BusinessProfileRepository = {
    async findByUserId(userId) {
      const row = await db
        .prepare(
          "SELECT user_id, business_name, name, email, phone, website, address, logo_url, updated_at FROM business_profiles WHERE user_id = ? LIMIT 1",
        )
        .bind(userId)
        .first<ProfileRow>();
      return row ? mapProfile(row) : null;
    },
    async upsert(record) {
      await db
        .prepare(
          `INSERT INTO business_profiles (user_id, business_name, name, email, phone, website, address, logo_url, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id) DO UPDATE SET
             business_name = excluded.business_name,
             name = excluded.name,
             email = excluded.email,
             phone = excluded.phone,
             website = excluded.website,
             address = excluded.address,
             logo_url = excluded.logo_url,
             updated_at = excluded.updated_at`,
        )
        .bind(
          record.userId,
          record.businessName,
          record.name,
          record.email,
          record.phone,
          record.website,
          record.address,
          record.logoUrl,
          record.updatedAt,
        )
        .run();
    },
  };

  const rateLimits: RateLimitStore = {
    async hit(action, key, nowIso, windowMs) {
      const cutoff = new Date(new Date(nowIso).getTime() - windowMs).toISOString();
      await db
        .prepare("DELETE FROM auth_attempts WHERE created_at < ?")
        .bind(cutoff)
        .run();
      await db
        .prepare(
          "INSERT INTO auth_attempts (action, key, created_at) VALUES (?, ?, ?)",
        )
        .bind(action, key, nowIso)
        .run();
      const row = await db
        .prepare(
          "SELECT COUNT(*) AS count FROM auth_attempts WHERE action = ? AND key = ? AND created_at >= ?",
        )
        .bind(action, key, cutoff)
        .first<{ count: number }>();
      return Number(row?.count ?? 0);
    },
  };

  const subscriptions: SubscriptionRepository = {
    async findByUserId(userId) {
      const row = await db
        .prepare(
          "SELECT id, user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, status, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at FROM subscriptions WHERE user_id = ? LIMIT 1",
        )
        .bind(userId)
        .first<SubscriptionRow>();
      return row ? mapSubscription(row) : null;
    },
    async findByStripeSubscriptionId(stripeSubscriptionId) {
      const row = await db
        .prepare(
          "SELECT id, user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, status, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at FROM subscriptions WHERE stripe_subscription_id = ? LIMIT 1",
        )
        .bind(stripeSubscriptionId)
        .first<SubscriptionRow>();
      return row ? mapSubscription(row) : null;
    },
    async findByStripeCustomerId(stripeCustomerId) {
      const row = await db
        .prepare(
          "SELECT id, user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, status, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at FROM subscriptions WHERE stripe_customer_id = ? LIMIT 1",
        )
        .bind(stripeCustomerId)
        .first<SubscriptionRow>();
      return row ? mapSubscription(row) : null;
    },
    async upsert(record) {
      const existing =
        (await this.findByStripeSubscriptionId(record.stripeSubscriptionId)) ??
        (await this.findByUserId(record.userId));
      if (existing) {
        await db
          .prepare(
            "UPDATE subscriptions SET user_id = ?, stripe_customer_id = ?, stripe_subscription_id = ?, stripe_price_id = ?, status = ?, current_period_start = ?, current_period_end = ?, cancel_at_period_end = ?, updated_at = ? WHERE id = ?",
          )
          .bind(
            record.userId,
            record.stripeCustomerId,
            record.stripeSubscriptionId,
            record.stripePriceId,
            record.status,
            record.currentPeriodStart,
            record.currentPeriodEnd,
            record.cancelAtPeriodEnd ? 1 : 0,
            record.updatedAt,
            existing.id,
          )
          .run();
        return;
      }

      await db
        .prepare(
          "INSERT INTO subscriptions (id, user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, status, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          record.id,
          record.userId,
          record.stripeCustomerId,
          record.stripeSubscriptionId,
          record.stripePriceId,
          record.status,
          record.currentPeriodStart,
          record.currentPeriodEnd,
          record.cancelAtPeriodEnd ? 1 : 0,
          record.createdAt,
          record.updatedAt,
        )
        .run();
    },
  };

  const processedStripeEvents: ProcessedStripeEventRepository = {
    async has(eventId) {
      const row = await db
        .prepare(
          "SELECT event_id FROM processed_stripe_events WHERE event_id = ? LIMIT 1",
        )
        .bind(eventId)
        .first<{ event_id: string }>();
      return Boolean(row);
    },
    async record(record) {
      try {
        await db
          .prepare(
            "INSERT INTO processed_stripe_events (event_id, event_type, processed_at) VALUES (?, ?, ?)",
          )
          .bind(record.eventId, record.eventType, record.processedAt)
          .run();
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message.includes("UNIQUE") || message.includes("unique")) {
          return false;
        }
        throw error;
      }
    },
  };

  return {
    users,
    sessions,
    verifications,
    passwordResets,
    subscriptions,
    processedStripeEvents,
    signatures,
    cards,
    qrCodes,
    customers,
    invoices,
    profiles,
    rateLimits,
  };
}
