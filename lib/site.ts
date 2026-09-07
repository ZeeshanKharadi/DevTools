export const SITE_NAME = "InfyraTools";

export const PARENT_BRAND = "InfyraEdge";
export const PARENT_BRAND_URL = "https://infyraedge.com";

export const LEGAL_EFFECTIVE_DATE = "2026-09-07";
export const LEGAL_EFFECTIVE_LABEL = "7 September 2026";

export const LEGAL_PAGES = [
  {
    path: "/privacy-policy",
    name: "Privacy Policy",
  },
  {
    path: "/terms",
    name: "Terms of Use",
  },
  {
    path: "/disclaimer",
    name: "Disclaimer",
  },
] as const;

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}
