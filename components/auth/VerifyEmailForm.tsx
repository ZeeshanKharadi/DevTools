"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/ui/Feedback";
import { resendVerificationEmail, verifyEmailCode } from "@/lib/pro/api";
import { ApiError } from "@/lib/pro/client";
import { useAuth } from "./AuthProvider";

const OTP_LENGTH = 6;
const RESEND_WAIT_SECONDS = 60;

function emptyDigits(): string[] {
  return Array.from({ length: OTP_LENGTH }, () => "");
}

export function VerifyEmailForm() {
  const router = useRouter();
  const { user, loading, refresh, logout } = useAuth();
  const [digits, setDigits] = useState(emptyDigits);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const [wait, setWait] = useState(RESEND_WAIT_SECONDS);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    } else if (!loading && user?.emailVerified) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (wait <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setWait((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);

  const code = digits.join("");

  function focusAt(index: number) {
    inputs.current[index]?.focus();
    inputs.current[index]?.select();
  }

  function applyCode(next: string) {
    const cleaned = next.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
    const filled = emptyDigits().map((_, index) => cleaned[index] ?? "");
    setDigits(filled);
    focusAt(Math.min(cleaned.length, OTP_LENGTH - 1));
    if (cleaned.length === OTP_LENGTH) {
      void submitCode(cleaned.join(""));
    }
  }

  async function submitCode(value: string) {
    if (value.length !== OTP_LENGTH || pending) {
      return;
    }

    setError(null);
    setInfo(null);
    setPending(true);
    try {
      await verifyEmailCode(value);
      await refresh();
      router.push("/dashboard");
    } catch (caught) {
      setDigits(emptyDigits());
      focusAt(0);
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not verify that code. Try again.",
      );
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await submitCode(code);
  }

  async function onResend() {
    setError(null);
    setInfo(null);
    setResending(true);
    try {
      const result = await resendVerificationEmail();
      if (result.alreadyVerified) {
        await refresh();
        router.push("/dashboard");
        return;
      }
      setWait(RESEND_WAIT_SECONDS);
      setInfo("A new code is on its way. Check your inbox.");
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not resend the code. Try again.",
      );
    } finally {
      setResending(false);
    }
  }

  function onDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < OTP_LENGTH - 1) {
      focusAt(index + 1);
    }
    const joined = next.join("");
    if (joined.length === OTP_LENGTH) {
      void submitCode(joined);
    }
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      focusAt(index - 1);
    }
    if (event.key === "ArrowLeft" && index > 0) {
      focusAt(index - 1);
    }
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      focusAt(index + 1);
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    applyCode(event.clipboardData.getData("text"));
  }

  if (loading || !user || user.emailVerified) {
    return <p className="text-sm text-muted">Loading verification…</p>;
  }

  return (
    <form className="space-y-5" onSubmit={(event) => void onSubmit(event)}>
      <p className="text-sm text-muted">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-foreground">{user.email}</span>. It
        expires in 10 minutes and can be used once.
      </p>
      <div>
        <p id="otp-label" className="mb-2 text-sm font-medium">
          Verification code
        </p>
        <div className="flex justify-between gap-2" role="group" aria-labelledby="otp-label">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(node) => {
                inputs.current[index] = node;
              }}
              value={digit}
              onChange={(event) => onDigitChange(index, event.target.value)}
              onKeyDown={(event) => onKeyDown(index, event)}
              onPaste={onPaste}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
              maxLength={1}
              className="h-12 w-10 rounded-md border border-line bg-panel text-center text-lg font-semibold tracking-widest text-foreground shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:w-12 sm:text-xl"
              disabled={pending}
            />
          ))}
        </div>
      </div>
      {error ? (
        <Feedback tone="error" live>
          {error}
        </Feedback>
      ) : null}
      {info ? (
        <Feedback tone="success" live>
          {info}
        </Feedback>
      ) : null}
      <Button variant="primary" type="submit" disabled={pending || code.length !== OTP_LENGTH}>
        {pending ? "Verifying…" : "Verify email"}
      </Button>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Button
          variant="ghost"
          disabled={resending || wait > 0}
          onClick={() => void onResend()}
        >
          {resending
            ? "Sending…"
            : wait > 0
              ? `Resend code in ${wait}s`
              : "Resend code"}
        </Button>
        <button
          type="button"
          className="text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          onClick={() => {
            void logout().then(() => router.push("/login"));
          }}
        >
          Sign out
        </button>
      </div>
    </form>
  );
}
