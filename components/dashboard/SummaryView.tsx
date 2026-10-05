"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BillingPanel } from "@/components/dashboard/BillingPanel";
import { DashboardShell, RequireAuth } from "@/components/dashboard/DashboardShell";
import { Feedback } from "@/components/ui/Feedback";
import { fetchDashboardSummary } from "@/lib/pro/api";
import { ApiError } from "@/lib/pro/client";
import type { DashboardSummary } from "@/lib/pro/client";

const CARDS: {
  key: keyof DashboardSummary;
  label: string;
  href: string;
  empty: string;
}[] = [
  {
    key: "signatures",
    label: "Saved Signatures",
    href: "/dashboard/signatures",
    empty: "None saved yet",
  },
  {
    key: "cards",
    label: "Business Cards",
    href: "/dashboard/cards",
    empty: "None hosted yet",
  },
  {
    key: "activeQr",
    label: "Active QR Codes",
    href: "/dashboard/qr",
    empty: "None active",
  },
  {
    key: "invoices",
    label: "Total Invoices",
    href: "/dashboard/invoices",
    empty: "None saved yet",
  },
];

export function SummaryView() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchDashboardSummary()
      .then((result) => {
        setSummary(result.summary);
        setError(null);
      })
      .catch((caught) => {
        setError(
          caught instanceof ApiError ? caught.message : "Could not load the dashboard.",
        );
      });
  }, []);

  return (
    <RequireAuth label="dashboard">
      <DashboardShell
        title="Dashboard"
        description="Manage saved signatures, hosted cards, dynamic QR codes, and invoices."
      >
        {error ? (
          <Feedback tone="error" live>
            {error}
          </Feedback>
        ) : null}
        <BillingPanel />
        {!summary && !error ? (
          <p className="text-sm text-muted">Loading summary…</p>
        ) : null}
        {summary ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {CARDS.map((card) => {
              const value = summary[card.key];
              return (
                <Link
                  key={card.key}
                  href={card.href}
                  className="rounded-xl border border-line bg-panel p-4 hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    {card.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
                  <p className="mt-1 text-xs text-muted">
                    {value === 0 ? card.empty : "View and manage"}
                  </p>
                </Link>
              );
            })}
          </section>
        ) : null}
        <Feedback>
          Free tools still work without an account. This dashboard only adds
          persistence and hosted/dynamic features.
        </Feedback>
      </DashboardShell>
    </RequireAuth>
  );
}
