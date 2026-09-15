"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardShell, RequireAuth, formatWhen } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/ui/Feedback";
import { deleteCard, duplicateCard, listCards, updateCard } from "@/lib/pro/api";
import { ApiError } from "@/lib/pro/client";
import type { CardListItem } from "@/lib/pro/client";

export function CardsView() {
  const [items, setItems] = useState<CardListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void listCards()
      .then((result) => setItems(result.cards))
      .catch((caught) => {
        setError(caught instanceof ApiError ? caught.message : "Could not load cards.");
      });
  }, []);

  async function handleDuplicate(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const result = await duplicateCard(id);
      setItems((current) => [result.card, ...(current ?? [])]);
      setSuccess("Card duplicated with a new public URL.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not duplicate.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggle(item: CardListItem) {
    setBusyId(item.id);
    setError(null);
    try {
      const result = await updateCard(item.id, { isActive: !item.isActive });
      setItems((current) =>
        (current ?? []).map((entry) => (entry.id === item.id ? result.card : entry)),
      );
      setSuccess(result.card.isActive ? "Card published." : "Card deactivated.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not update status.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRename(item: CardListItem) {
    const name = window.prompt("Rename card", item.name);
    if (!name || name.trim() === item.name) {
      return;
    }
    setBusyId(item.id);
    setError(null);
    try {
      const result = await updateCard(item.id, { name });
      setItems((current) =>
        (current ?? []).map((entry) => (entry.id === item.id ? result.card : entry)),
      );
      setSuccess("Card renamed.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not rename.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this hosted business card? The public URL will stop working.")) {
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      await deleteCard(id);
      setItems((current) => (current ?? []).filter((item) => item.id !== id));
      setSuccess("Card deleted.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not delete.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <RequireAuth label="cards">
      <DashboardShell
        title="Business Cards"
        description="Hosted cards get a public InfyraTools URL. The free generator still works locally without login."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">My cards</h2>
          <Link
            href="/tools/digital-business-card"
            className="inline-flex items-center justify-center rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Create Card
          </Link>
        </div>
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
        {items === null && !error ? <p className="text-sm text-muted">Loading cards…</p> : null}
        {items && items.length === 0 ? (
          <Feedback>
            No hosted cards yet. Open the Digital Business Card Generator, sign
            in, and save a card to publish it.
          </Feedback>
        ) : null}
        {items && items.length > 0 ? (
          <ul className="space-y-3">
            {items.map((card) => (
              <li
                key={card.id}
                className="flex flex-col gap-3 rounded-xl border border-line bg-panel p-4"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{card.name}</p>
                    <p className="text-xs text-muted">
                      {card.isActive ? "Published" : "Inactive"} · Updated{" "}
                      {formatWhen(card.updatedAt)}
                    </p>
                    <p className="mt-1 break-all text-xs text-muted">{card.publicUrl}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={card.publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-md border border-line bg-panel px-3 py-2 text-sm font-medium text-foreground hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      Preview
                    </a>
                    <Link
                      href={`/tools/digital-business-card?card=${card.id}`}
                      className="inline-flex items-center justify-center rounded-md border border-line bg-panel px-3 py-2 text-sm font-medium text-foreground hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      Open / Edit
                    </Link>
                    <Button disabled={busyId === card.id} onClick={() => void handleRename(card)}>
                      Rename
                    </Button>
                    <Button disabled={busyId === card.id} onClick={() => void handleToggle(card)}>
                      {card.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      disabled={busyId === card.id}
                      onClick={() => void handleDuplicate(card.id)}
                    >
                      Duplicate
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={busyId === card.id}
                      onClick={() => void handleDelete(card.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        <Feedback>
          Local photos are not stored. Use a hosted https:// image URL if the
          public card should show a photo or logo. Object storage (R2) is not
          enabled in this phase.
        </Feedback>
      </DashboardShell>
    </RequireAuth>
  );
}
