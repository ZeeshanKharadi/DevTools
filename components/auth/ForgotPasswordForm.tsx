"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Input";
import { requestPasswordReset } from "@/lib/pro/api";
import { ApiError } from "@/lib/pro/client";

const SUCCESS_MESSAGE =
  "If an account exists for this email, you will receive a password reset link.";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setPending(true);

    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not send a reset link. Try again.",
      );
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <Feedback tone="success" live>
          {SUCCESS_MESSAGE}
        </Feedback>
        <p className="text-sm text-muted">
          <Link
            href="/login"
            className="font-medium text-foreground hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
      <div className="space-y-1">
        <label htmlFor="forgot-email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      {error ? (
        <Feedback tone="error" live>
          {error}
        </Feedback>
      ) : null}
      <Button variant="primary" type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-sm text-muted">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
