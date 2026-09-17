export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
};

export type EmailVerificationRecord = {
  id: string;
  userId: string;
  otpHash: string;
  expiresAt: string;
  consumedAt: string | null;
  failedAttempts: number;
  createdAt: string;
};

export type SessionRecord = {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  lastUsedAt: string;
};

export type SignatureRecord = {
  id: string;
  userId: string;
  name: string;
  signatureData: string;
  createdAt: string;
  updatedAt: string;
};

export type BusinessCardRecord = {
  id: string;
  userId: string;
  name: string;
  publicSlug: string;
  isActive: boolean;
  cardData: string;
  createdAt: string;
  updatedAt: string;
};

export type DynamicQrRecord = {
  id: string;
  userId: string;
  name: string;
  code: string;
  destinationUrl: string;
  isActive: boolean;
  totalScans: number;
  lastScannedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerRecord = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceRecord = {
  id: string;
  userId: string;
  invoiceNumber: string;
  status: string;
  currency: string;
  invoiceData: string;
  createdAt: string;
  updatedAt: string;
};

export type BusinessProfileRecord = {
  userId: string;
  businessName: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  logoUrl: string;
  updatedAt: string;
};

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    emailVerified: Boolean(user.emailVerifiedAt),
    createdAt: user.createdAt,
  };
}
