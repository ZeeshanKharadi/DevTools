"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Input";
import { loginAccount } from "@/lib/pro/api";
import { ApiError } from "@/lib/pro/client";
import { useAuth } from "./AuthProvider";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const resetSuccess = searchParams.get("reset") === "1";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const result = await loginAccount(email, password);
      await refresh();
      router.push(result.user.emailVerified ? "/dashboard" : "/verify-email");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not sign in. Try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
      {resetSuccess ? (
        <Feedback tone="success" live>
          Your password was updated. Sign in with your new password.
        </Feedback>
      ) : null}
      <div className="space-y-1">
        <label htmlFor="login-email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="login-password" className="text-sm font-medium">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-muted hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      {error ? (
        <Feedback tone="error" live>
          {error}
        </Feedback>
      ) : null}
      <Button variant="primary" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-sm text-muted">
        No account?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          Register
        </Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <LoginFormInner />
    </Suspense>
  );
}
