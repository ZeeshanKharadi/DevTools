"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Input";
import { resetPassword } from "@/lib/pro/api";
import { ApiError } from "@/lib/pro/client";

function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("That reset link is invalid or has expired.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      await resetPassword(token, password);
      router.replace("/login?reset=1");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not reset the password. Try again.",
      );
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <Feedback tone="error" live>
          That reset link is invalid or has expired.
        </Feedback>
        <p className="text-sm text-muted">
          <Link
            href="/forgot-password"
            className="font-medium text-foreground hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            Request a new reset link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
      <div className="space-y-1">
        <label htmlFor="reset-password" className="text-sm font-medium">
          New password
        </label>
        <Input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={10}
          required
        />
        <p className="text-xs text-muted">At least 10 characters.</p>
      </div>
      <div className="space-y-1">
        <label htmlFor="reset-confirm" className="text-sm font-medium">
          Confirm password
        </label>
        <Input
          id="reset-confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          minLength={10}
          required
        />
      </div>
      {error ? (
        <Feedback tone="error" live>
          {error}
        </Feedback>
      ) : null}
      <Button variant="primary" type="submit" disabled={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>
      <p className="text-sm text-muted">
        <Link
          href="/login"
          className="font-medium text-foreground hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <ResetPasswordFormInner />
    </Suspense>
  );
}
