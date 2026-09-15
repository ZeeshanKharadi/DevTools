"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Input";
import { createCard, updateCard } from "@/lib/pro/api";
import { ApiError } from "@/lib/pro/client";
import type { CardInput } from "@/lib/tools/digital-business-card";

type CardSaveControlsProps = {
  input: CardInput;
  savedId: string | null;
  savedName: string;
  savedSlug: string;
  onSaved: (id: string, name: string, slug: string, warnings: string[]) => void;
};

export function CardSaveControls({
  input,
  savedId,
  savedName,
  savedSlug,
  onSaved,
}: CardSaveControlsProps) {
  const { user, loading } = useAuth();
  const [name, setName] = useState(savedName);
  const [slug, setSlug] = useState(savedSlug);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <Feedback>
        Sign in to host this card at a public InfyraTools URL. You can still
        preview and download it without signing in.{" "}
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
          ? await updateCard(savedId, {
              name,
              slug: slug.trim() || undefined,
              data: input,
            })
          : await createCard({
              name,
              slug: slug.trim() || undefined,
              data: input,
            });
      onSaved(
        result.card.id,
        result.card.name,
        result.card.publicSlug,
        result.card.warnings,
      );
      setSlug(result.card.publicSlug);
      const warningText = result.card.warnings[0];
      setSuccess(
        warningText
          ? `Card saved at ${result.card.publicUrl}. ${warningText}`
          : `Card saved at ${result.card.publicUrl}`,
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not save.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-line bg-panel p-3">
      <p className="text-sm font-medium">Save and host card</p>
      <div className="space-y-1">
        <label htmlFor="card-save-name" className="text-xs text-muted">
          Saved name
        </label>
        <Input
          id="card-save-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Work card"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="card-save-slug" className="text-xs text-muted">
          Public slug (optional)
        </label>
        <Input
          id="card-save-slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="jane-rivera"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          disabled={pending || !name.trim()}
          onClick={() => void save(false)}
        >
          {pending ? "Saving…" : savedId ? "Save changes" : "Save card"}
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
