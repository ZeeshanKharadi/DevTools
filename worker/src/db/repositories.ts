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

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  create(user: UserRecord): Promise<void>;
  markEmailVerified(userId: string, verifiedAt: string): Promise<void>;
}

export interface EmailVerificationRepository {
  create(record: EmailVerificationRecord): Promise<void>;
  findActiveByUserId(
    userId: string,
    nowIso: string,
  ): Promise<EmailVerificationRecord | null>;
  findLatestByUserId(userId: string): Promise<EmailVerificationRecord | null>;
  consume(id: string, consumedAt: string): Promise<void>;
  consumeAllForUser(userId: string, consumedAt: string): Promise<void>;
  incrementFailures(id: string): Promise<number>;
}

export interface SessionRepository {
  create(session: SessionRecord): Promise<void>;
  findById(id: string, nowIso: string): Promise<SessionRecord | null>;
  delete(id: string): Promise<void>;
  deleteIfExpired(id: string, nowIso: string): Promise<void>;
  deleteExpired(nowIso: string): Promise<void>;
  touch(id: string, lastUsedAt: string): Promise<void>;
}

export interface SignatureRepository {
  listByUser(userId: string): Promise<SignatureRecord[]>;
  findById(id: string): Promise<SignatureRecord | null>;
  create(record: SignatureRecord): Promise<void>;
  update(record: SignatureRecord): Promise<void>;
  delete(id: string, userId: string): Promise<boolean>;
  countByUser(userId: string): Promise<number>;
}

export interface CardRepository {
  listByUser(userId: string): Promise<BusinessCardRecord[]>;
  findById(id: string): Promise<BusinessCardRecord | null>;
  findBySlug(slug: string): Promise<BusinessCardRecord | null>;
  create(record: BusinessCardRecord): Promise<void>;
  update(record: BusinessCardRecord): Promise<void>;
  delete(id: string, userId: string): Promise<boolean>;
  countByUser(userId: string): Promise<number>;
}

export interface QrCodeRepository {
  listByUser(userId: string): Promise<DynamicQrRecord[]>;
  findById(id: string): Promise<DynamicQrRecord | null>;
  findByCode(code: string): Promise<DynamicQrRecord | null>;
  create(record: DynamicQrRecord): Promise<void>;
  update(record: DynamicQrRecord): Promise<void>;
  delete(id: string, userId: string): Promise<boolean>;
  countActiveByUser(userId: string): Promise<number>;
  recordScan(id: string, scannedAt: string, eventId: string): Promise<void>;
}

export interface CustomerRepository {
  listByUser(userId: string): Promise<CustomerRecord[]>;
  findById(id: string): Promise<CustomerRecord | null>;
  create(record: CustomerRecord): Promise<void>;
  update(record: CustomerRecord): Promise<void>;
  delete(id: string, userId: string): Promise<boolean>;
}

export interface InvoiceRepository {
  listByUser(userId: string, query?: string): Promise<InvoiceRecord[]>;
  findById(id: string): Promise<InvoiceRecord | null>;
  create(record: InvoiceRecord): Promise<void>;
  update(record: InvoiceRecord): Promise<void>;
  delete(id: string, userId: string): Promise<boolean>;
  countByUser(userId: string): Promise<number>;
}

export interface BusinessProfileRepository {
  findByUserId(userId: string): Promise<BusinessProfileRecord | null>;
  upsert(record: BusinessProfileRecord): Promise<void>;
}

export interface RateLimitStore {
  hit(action: string, key: string, nowIso: string, windowMs: number): Promise<number>;
}

export type Repositories = {
  users: UserRepository;
  sessions: SessionRepository;
  verifications: EmailVerificationRepository;
  signatures: SignatureRepository;
  cards: CardRepository;
  qrCodes: QrCodeRepository;
  customers: CustomerRepository;
  invoices: InvoiceRepository;
  profiles: BusinessProfileRepository;
  rateLimits: RateLimitStore;
};
