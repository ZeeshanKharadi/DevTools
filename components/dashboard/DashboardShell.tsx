"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/signatures", label: "Email Signatures" },
  { href: "/dashboard/cards", label: "Business Cards" },
  { href: "/dashboard/qr", label: "Dynamic QR Codes" },
  { href: "/dashboard/invoices", label: "Invoices" },
  { href: "/dashboard/customers", label: "Customers" },
  { href: "/dashboard/account", label: "Account" },
];

export function formatWhen(value: string): string {
  return new Date(value).toLocaleString();
}

export function RequireAuth({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <p className="text-sm text-muted">Loading {label}…</p>;
  }

  return <>{children}</>;
}

export function DashboardShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { user } = useAuth();
  const pathname = usePathname();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          InfyraTools Pro Beta
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted">
          {description}
          {user ? ` Signed in as ${user.email}.` : ""}
        </p>
        <p className="mt-3 rounded-md border border-line bg-panel px-3 py-2 text-sm text-muted">
          InfyraTools Pro Beta — Complimentary access to all Pro features during
          beta. No payment method required.
        </p>
      </div>
      <nav aria-label="Account">
        <ul className="flex flex-wrap gap-1">
          {NAV.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "inline-flex rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                    active
                      ? "bg-brand text-brand-foreground"
                      : "text-muted hover:bg-panel-hover hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {children}
    </div>
  );
}
