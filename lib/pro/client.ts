export type PublicUser = {
  id: string;
  email: string;
  createdAt: string;
};

export type SignatureListItem = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type SignatureDetail = SignatureListItem & {
  data: unknown;
  warnings: string[];
};

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
  data: unknown;
  warnings: string[];
};

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

export type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  status: "draft" | "sent" | "paid" | "cancelled";
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceDetail = InvoiceListItem & {
  data: unknown;
  warnings: string[];
};

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

export type DashboardSummary = {
  signatures: number;
  cards: number;
  activeQr: number;
  invoices: number;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

export function apiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!configured) {
    return "";
  }

  return configured.replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  return `${apiBaseUrl()}${path}`;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => null)) as T | ApiErrorBody | null;
  if (!response.ok) {
    const error = data as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      error?.error?.code ?? "request_failed",
      error?.error?.message ?? "The request failed.",
    );
  }

  return data as T;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });
  return parseResponse<T>(response);
}
