"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Input";
import { createSignature, updateSignature } from "@/lib/pro/api";
import { ApiError } from "@/lib/pro/client";
import type { SignatureInput } from "@/lib/tools/email-signature-generator";

type SignatureSaveControlsProps = {
  input: SignatureInput;
  savedId: string | null;
  savedName: string;
  onSaved: (id: string, name: string, warnings: string[]) => void;
};

export function SignatureSaveControls({
  input,
  savedId,
  savedName,
  onSaved,
}: SignatureSaveControlsProps) {
  const { user, loading } = useAuth();
  const [name, setName] = useState(savedName);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <Feedback>
        Sign in to save this signature to your InfyraTools account. You can still
        copy or download it without signing in.{" "}
        <Link
          href="/login"
          className="font-medium text-foreground hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          Sign in
        </Link>
      </Feedback>
    );
  }

  async function save(asNew: boolean) {
    setPending(true);
    setError(null);
    setSuccess(null);

    try {
      const result =
        savedId && !asNew
          ? await updateSignature(savedId, { name, data: input })
          : await createSignature(name, input);
      onSaved(result.signature.id, result.signature.name, result.signature.warnings);
      const warningText = result.signature.warnings[0];
      setSuccess(
        warningText
          ? `${savedId && !asNew ? "Signature saved." : "Signature created."} ${warningText}`
          : savedId && !asNew
            ? "Signature saved."
            : "Signature created.",
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not save.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-line bg-panel p-3">
      <p className="text-sm font-medium">Save Signature</p>
      <div className="space-y-1">
        <label htmlFor="signature-save-name" className="text-xs text-muted">
          Saved name
        </label>
        <Input
          id="signature-save-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Work Signature"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          disabled={pending || !name.trim()}
          onClick={() => void save(false)}
        >
          {pending ? "Saving…" : savedId ? "Save changes" : "Save Signature"}
        </Button>
        {savedId ? (
          <Button disabled={pending || !name.trim()} onClick={() => void save(true)}>
            Save as new
          </Button>
        ) : null}
      </div>
      {success ? (
        <Feedback tone="success" live>
          {success}
        </Feedback>
      ) : null}
      {error ? (
        <Feedback tone="error" live>
          {error}
        </Feedback>
      ) : null}
    </div>
  );
}
