"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/ui/Feedback";
import {
  createCheckoutSession,
  fetchBillingSubscription,
} from "@/lib/pro/api";
import { ApiError } from "@/lib/pro/client";

type SubscriptionState = {
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  entitled: boolean;
};

export function BillingPanel() {
  const [subscription, setSubscription] = useState<SubscriptionState | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void fetchBillingSubscription()
      .then((result) => {
        setSubscription(result.subscription);
        setError(null);
      })
      .catch((caught) => {
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Could not load billing status.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  async function onUpgrade() {
    setPending(true);
    setError(null);
    try {
      const result = await createCheckoutSession();
      window.location.assign(result.url);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not start checkout. Try again.",
      );
      setPending(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading subscription…</p>;
  }

  const entitled = Boolean(subscription?.entitled);
  const cancelScheduled = Boolean(subscription?.cancelAtPeriodEnd);

  return (
    <section className="space-y-3 rounded-xl border border-line bg-panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">InfyraTools Pro</h2>
          <p className="mt-1 text-sm text-muted">
            Hosted cards, dynamic QR codes, invoices, and saved workspace features.
          </p>
        </div>
        {entitled ? (
          <span className="rounded-md border border-brand/30 bg-brand-soft px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
            Pro Active
          </span>
        ) : null}
      </div>

      {entitled ? (
        <div className="space-y-1 text-sm text-muted">
          <p>
            Status:{" "}
            <span className="font-medium text-foreground">
              {subscription?.status ?? "active"}
            </span>
          </p>
          {subscription?.currentPeriodEnd ? (
            <p>
              {cancelScheduled ? "Access continues until" : "Current period ends"}{" "}
              {new Date(subscription.currentPeriodEnd).toLocaleString()}.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            Upgrade to unlock Pro features on this account. Payment is handled by
            Stripe — InfyraTools never stores card details.
          </p>
          <Button
            variant="primary"
            type="button"
            disabled={pending}
            onClick={() => void onUpgrade()}
          >
            {pending ? "Redirecting…" : "Upgrade to Pro"}
          </Button>
        </div>
      )}

      {error ? (
        <Feedback tone="error" live>
          {error}
        </Feedback>
      ) : null}
    </section>
  );
}
