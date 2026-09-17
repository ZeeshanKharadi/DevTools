import {
  ApiError,
  apiFetch,
  type BusinessProfile,
  type CardDetail,
  type CardListItem,
  type CustomerDetail,
  type DashboardSummary,
  type InvoiceDetail,
  type InvoiceListItem,
  type PublicUser,
  type QrListItem,
  type SignatureDetail,
  type SignatureListItem,
} from "./client";
import type { SignatureInput } from "@/lib/tools/email-signature-generator";
import type { CardInput } from "@/lib/tools/digital-business-card";
import type { InvoiceInput } from "@/lib/tools/invoice-generator";
import type { InvoiceStatus } from "@/lib/tools/invoice-generator/stored";

export async function fetchCurrentUser(): Promise<PublicUser | null> {
  try {
    const data = await apiFetch<{ user: PublicUser }>("/api/auth/me");
    return data.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

export function registerAccount(email: string, password: string) {
  return apiFetch<{ user: PublicUser; emailSent: boolean }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function loginAccount(email: string, password: string) {
  return apiFetch<{ user: PublicUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logoutAccount() {
  return apiFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
}

export function verifyEmailCode(code: string) {
  return apiFetch<{ user: PublicUser }>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function resendVerificationEmail() {
  return apiFetch<{ ok: boolean; emailSent: boolean; alreadyVerified: boolean }>(
    "/api/auth/resend-verification",
    { method: "POST" },
  );
}

export function fetchDashboardSummary() {
  return apiFetch<{ summary: DashboardSummary }>("/api/dashboard/summary");
}

export function listSignatures() {
  return apiFetch<{ signatures: SignatureListItem[] }>("/api/signatures");
}

export function getSignature(id: string) {
  return apiFetch<{ signature: SignatureDetail }>(`/api/signatures/${id}`);
}

export function createSignature(name: string, data: SignatureInput) {
  return apiFetch<{ signature: SignatureDetail }>("/api/signatures", {
    method: "POST",
    body: JSON.stringify({ name, data }),
  });
}

export function updateSignature(
  id: string,
  input: { name?: string; data?: SignatureInput },
) {
  return apiFetch<{ signature: SignatureDetail }>(`/api/signatures/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function duplicateSignature(id: string) {
  return apiFetch<{ signature: SignatureDetail }>(`/api/signatures/${id}/duplicate`, {
    method: "POST",
  });
}

export function deleteSignature(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/signatures/${id}`, { method: "DELETE" });
}

export function listCards() {
  return apiFetch<{ cards: CardListItem[] }>("/api/cards");
}

export function getCard(id: string) {
  return apiFetch<{ card: CardDetail }>(`/api/cards/${id}`);
}

export function createCard(input: {
  name: string;
  slug?: string;
  data: CardInput;
  isActive?: boolean;
}) {
  return apiFetch<{ card: CardDetail }>("/api/cards", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCard(
  id: string,
  input: {
    name?: string;
    slug?: string;
    data?: CardInput;
    isActive?: boolean;
  },
) {
  return apiFetch<{ card: CardDetail }>(`/api/cards/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function duplicateCard(id: string) {
  return apiFetch<{ card: CardDetail }>(`/api/cards/${id}/duplicate`, {
    method: "POST",
  });
}

export function deleteCard(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/cards/${id}`, { method: "DELETE" });
}

export function listQrCodes() {
  return apiFetch<{ qrCodes: QrListItem[] }>("/api/qr");
}

export function getQrCode(id: string) {
  return apiFetch<{ qrCode: QrListItem }>(`/api/qr/${id}`);
}

export function createQrCode(input: {
  name: string;
  destinationUrl: string;
  isActive?: boolean;
}) {
  return apiFetch<{ qrCode: QrListItem }>("/api/qr", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateQrCode(
  id: string,
  input: { name?: string; destinationUrl?: string; isActive?: boolean },
) {
  return apiFetch<{ qrCode: QrListItem }>(`/api/qr/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function duplicateQrCode(id: string) {
  return apiFetch<{ qrCode: QrListItem }>(`/api/qr/${id}/duplicate`, {
    method: "POST",
  });
}

export function deleteQrCode(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/qr/${id}`, { method: "DELETE" });
}

export function listInvoices(query?: string) {
  const path = query?.trim()
    ? `/api/invoices?q=${encodeURIComponent(query.trim())}`
    : "/api/invoices";
  return apiFetch<{ invoices: InvoiceListItem[] }>(path);
}

export function getInvoice(id: string) {
  return apiFetch<{ invoice: InvoiceDetail }>(`/api/invoices/${id}`);
}

export function createInvoice(input: {
  invoiceNumber?: string;
  status?: InvoiceStatus;
  data: InvoiceInput;
}) {
  return apiFetch<{ invoice: InvoiceDetail }>("/api/invoices", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateInvoice(
  id: string,
  input: {
    invoiceNumber?: string;
    status?: InvoiceStatus;
    data?: InvoiceInput;
  },
) {
  return apiFetch<{ invoice: InvoiceDetail }>(`/api/invoices/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function duplicateInvoice(id: string) {
  return apiFetch<{ invoice: InvoiceDetail }>(`/api/invoices/${id}/duplicate`, {
    method: "POST",
  });
}

export function deleteInvoice(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/invoices/${id}`, { method: "DELETE" });
}

export function listCustomers() {
  return apiFetch<{ customers: CustomerDetail[] }>("/api/customers");
}

export function createCustomer(input: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
}) {
  return apiFetch<{ customer: CustomerDetail }>("/api/customers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCustomer(
  id: string,
  input: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
  },
) {
  return apiFetch<{ customer: CustomerDetail }>(`/api/customers/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteCustomer(id: string) {
  return apiFetch<{ ok: boolean }>(`/api/customers/${id}`, { method: "DELETE" });
}

export function getBusinessProfile() {
  return apiFetch<{ profile: BusinessProfile }>("/api/account/profile");
}

export function updateBusinessProfile(input: Partial<BusinessProfile>) {
  return apiFetch<{ profile: BusinessProfile }>("/api/account/profile", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
