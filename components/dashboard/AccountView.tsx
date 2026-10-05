"use client";

import { useEffect, useState } from "react";
import { BillingPanel } from "@/components/dashboard/BillingPanel";
import { DashboardShell, RequireAuth } from "@/components/dashboard/DashboardShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Input";
import { getBusinessProfile, updateBusinessProfile } from "@/lib/pro/api";
import { ApiError } from "@/lib/pro/client";
import type { BusinessProfile } from "@/lib/pro/client";

const EMPTY: Omit<BusinessProfile, "updatedAt"> = {
  businessName: "",
  name: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  logoUrl: "",
};

export function AccountView() {
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    void getBusinessProfile()
      .then((result) => {
        setForm({
          businessName: result.profile.businessName,
          name: result.profile.name,
          email: result.profile.email,
          phone: result.profile.phone,
          website: result.profile.website,
          address: result.profile.address,
          logoUrl: result.profile.logoUrl,
        });
      })
      .catch((caught) => {
        setError(
          caught instanceof ApiError ? caught.message : "Could not load the profile.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setPending(true);
    setError(null);
    try {
      const result = await updateBusinessProfile(form);
      setForm({
        businessName: result.profile.businessName,
        name: result.profile.name,
        email: result.profile.email,
        phone: result.profile.phone,
        website: result.profile.website,
        address: result.profile.address,
        logoUrl: result.profile.logoUrl,
      });
      setSuccess("Business profile saved. You can apply it in the invoice or card tools.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not save.");
    } finally {
      setPending(false);
    }
  }

  return (
    <RequireAuth label="account">
      <DashboardShell
        title="Account"
        description="Optional business details for invoices, signatures, and cards. Nothing here is required."
      >
        <div className="rounded-xl border border-line bg-panel p-4">
          <p className="text-sm font-medium">Sign-in email</p>
          <p className="mt-1 text-sm text-muted">{user?.email}</p>
        </div>
        <BillingPanel />
        {loading ? <p className="text-sm text-muted">Loading profile…</p> : null}
        <form
          className="space-y-3 rounded-xl border border-line bg-panel p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <h2 className="text-lg font-semibold tracking-tight">Business profile</h2>
          {(
            [
              ["businessName", "Business name"],
              ["name", "Contact name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["website", "Website"],
              ["address", "Address"],
              ["logoUrl", "Logo URL (https)"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <label htmlFor={`profile-${key}`} className="text-sm font-medium">
                {label}
              </label>
              <Input
                id={`profile-${key}`}
                value={form[key]}
                onChange={(event) =>
                  setForm((current) => ({ ...current, [key]: event.target.value }))
                }
              />
            </div>
          ))}
          <Button variant="primary" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </form>
        {error ? (
          <Feedback tone="error" live>
            {error}
          </Feedback>
        ) : null}
        {success ? (
          <Feedback tone="success" live>
            {success}
          </Feedback>
        ) : null}
        <Feedback>
          This profile does not replace tool-specific fields. Logo files cannot
          be uploaded until object storage is added later.
        </Feedback>
      </DashboardShell>
    </RequireAuth>
  );
}
