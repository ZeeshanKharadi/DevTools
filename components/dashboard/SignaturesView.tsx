"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardShell, RequireAuth, formatWhen } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/Button";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { Feedback } from "@/components/ui/Feedback";
import {
  deleteSignature,
  duplicateSignature,
  getSignature,
  listSignatures,
  updateSignature,
} from "@/lib/pro/api";
import { ApiError } from "@/lib/pro/client";
import type { SignatureListItem } from "@/lib/pro/client";
import {
  copyRichHtml,
  renderSignature,
  type SignatureInput,
} from "@/lib/tools/email-signature-generator";

export function SignaturesView() {
  const [items, setItems] = useState<SignatureListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewDocument, setPreviewDocument] = useState<string>("");
  const [previewPlain, setPreviewPlain] = useState<string>("");
  const [previewInput, setPreviewInput] = useState<SignatureInput | null>(null);

  useEffect(() => {
    void listSignatures()
      .then((result) => setItems(result.signatures))
      .catch((caught) => {
        setError(caught instanceof ApiError ? caught.message : "Could not load signatures.");
      });
  }, []);

  async function loadPreview(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const result = await getSignature(id);
      const rendered = renderSignature(result.signature.data as SignatureInput);
      setPreviewId(id);
      setPreviewHtml(rendered.html);
      setPreviewDocument(rendered.document);
      setPreviewPlain(rendered.plainText);
      setPreviewInput(result.signature.data as SignatureInput);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not preview.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDuplicate(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const result = await duplicateSignature(id);
      setItems((current) => [result.signature, ...(current ?? [])]);
      setSuccess("Signature duplicated.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not duplicate.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRename(item: SignatureListItem) {
    const name = window.prompt("Rename signature", item.name);
    if (!name || name.trim() === item.name) {
      return;
    }
    setBusyId(item.id);
    setError(null);
    try {
      const result = await updateSignature(item.id, { name });
      setItems((current) =>
        (current ?? []).map((entry) =>
          entry.id === item.id ? { ...entry, name: result.signature.name } : entry,
        ),
      );
      setSuccess("Signature renamed.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not rename.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this saved signature?")) {
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      await deleteSignature(id);
      setItems((current) => (current ?? []).filter((item) => item.id !== id));
      if (previewId === id) {
        setPreviewId(null);
      }
      setSuccess("Signature deleted.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not delete.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <RequireAuth label="signatures">
      <DashboardShell
        title="Email Signatures"
        description="Saved signatures stay structured and open in the existing generator."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">My signatures</h2>
          <Link
            href="/tools/email-signature-generator"
            className="inline-flex items-center justify-center rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Create Signature
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
        {items === null && !error ? (
          <p className="text-sm text-muted">Loading signatures…</p>
        ) : null}
        {items && items.length === 0 ? (
          <Feedback>
            No saved signatures yet. Create one in the Email Signature Generator
            and choose Save Signature.
          </Feedback>
        ) : null}
        {items && items.length > 0 ? (
          <ul className="space-y-3">
            {items.map((signature) => (
              <li
                key={signature.id}
                className="space-y-3 rounded-xl border border-line bg-panel p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{signature.name}</p>
                    <p className="text-xs text-muted">
                      Updated {formatWhen(signature.updatedAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={busyId === signature.id}
                      onClick={() => void loadPreview(signature.id)}
                    >
                      Preview
                    </Button>
                    <Link
                      href={`/tools/email-signature-generator?signature=${signature.id}`}
                      className="inline-flex items-center justify-center rounded-md border border-line bg-panel px-3 py-2 text-sm font-medium text-foreground hover:bg-panel-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      Open / Edit
                    </Link>
                    <Button
                      disabled={busyId === signature.id}
                      onClick={() => void handleRename(signature)}
                    >
                      Rename
                    </Button>
                    <Button
                      disabled={busyId === signature.id}
                      onClick={() => void handleDuplicate(signature.id)}
                    >
                      Duplicate
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={busyId === signature.id}
                      onClick={() => void handleDelete(signature.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {previewId === signature.id && previewInput ? (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-lg border border-line bg-white">
                      <iframe
                        title={`${signature.name} preview`}
                        sandbox=""
                        srcDoc={
                          previewHtml ||
                          "<p style='font-family:Arial,sans-serif;color:#5e594f'>Empty signature.</p>"
                        }
                        className="min-h-48 w-full border-0 bg-white"
                        style={{ colorScheme: "light" }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="primary"
                        onClick={() => {
                          void copyRichHtml(previewHtml, previewPlain)
                            .then(() => setSuccess("Copied as rich HTML."))
                            .catch(() => setError("Could not copy the signature."));
                        }}
                      >
                        Copy signature
                      </Button>
                      <Button
                        onClick={() => {
                          void navigator.clipboard
                            .writeText(previewHtml)
                            .then(() => setSuccess("Copied HTML."))
                            .catch(() => setError("Could not copy HTML."));
                        }}
                      >
                        Copy HTML
                      </Button>
                      <DownloadButton
                        value={previewDocument}
                        filename="email-signature.html"
                        mimeType="text/html;charset=utf-8"
                        label="Download HTML"
                      />
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </DashboardShell>
    </RequireAuth>
  );
}
