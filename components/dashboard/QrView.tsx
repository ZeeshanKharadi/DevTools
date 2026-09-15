"use client";

import { useEffect, useState } from "react";
import { DashboardShell, RequireAuth, formatWhen } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Input";
import {
  createQrCode,
  deleteQrCode,
  duplicateQrCode,
  listQrCodes,
  updateQrCode,
} from "@/lib/pro/api";
import { ApiError } from "@/lib/pro/client";
import type { QrListItem } from "@/lib/pro/client";
import { DEFAULT_STYLE, renderQrText } from "@/lib/tools/qr-code-generator";

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function downloadSvg(svg: string, filename: string) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function QrView() {
  const [items, setItems] = useState<QrListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [previews, setPreviews] = useState<
    Record<string, { png: string; svg: string }>
  >({});

  useEffect(() => {
    void listQrCodes()
      .then((result) => setItems(result.qrCodes))
      .catch((caught) => {
        setError(caught instanceof ApiError ? caught.message : "Could not load QR codes.");
      });
  }, []);

  useEffect(() => {
    if (!items) {
      return;
    }

    let cancelled = false;
    void Promise.all(
      items.map(async (item) => {
        const rendered = await renderQrText(item.publicUrl, DEFAULT_STYLE);
        return [item.id, rendered] as const;
      }),
    ).then((results) => {
      if (cancelled) {
        return;
      }
      const next: Record<string, { png: string; svg: string }> = {};
      for (const [id, rendered] of results) {
        if (rendered.ok) {
          next[id] = { png: rendered.pngDataUrl, svg: rendered.svg };
        }
      }
      setPreviews(next);
    });

    return () => {
      cancelled = true;
    };
  }, [items]);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const result = await createQrCode({ name, destinationUrl });
      setItems((current) => [result.qrCode, ...(current ?? [])]);
      setName("");
      setDestinationUrl("");
      setSuccess("Dynamic QR created. The image encodes the InfyraTools short URL.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not create.");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdateDestination(item: QrListItem) {
    const next = window.prompt("New destination URL", item.destinationUrl);
    if (!next || next.trim() === item.destinationUrl) {
      return;
    }
    setBusyId(item.id);
    setError(null);
    try {
      const result = await updateQrCode(item.id, { destinationUrl: next });
      setItems((current) =>
        (current ?? []).map((entry) => (entry.id === item.id ? result.qrCode : entry)),
      );
      setSuccess("Destination updated. The QR image is unchanged.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not update destination.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggle(item: QrListItem) {
    setBusyId(item.id);
    setError(null);
    try {
      const result = await updateQrCode(item.id, { isActive: !item.isActive });
      setItems((current) =>
        (current ?? []).map((entry) => (entry.id === item.id ? result.qrCode : entry)),
      );
      setSuccess(result.qrCode.isActive ? "QR code activated." : "QR code deactivated.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not update status.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDuplicate(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const result = await duplicateQrCode(id);
      setItems((current) => [result.qrCode, ...(current ?? [])]);
      setSuccess("Duplicated with a new short code.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not duplicate.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this dynamic QR code? Scans will stop resolving.")) {
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      await deleteQrCode(id);
      setItems((current) => (current ?? []).filter((item) => item.id !== id));
      setSuccess("QR code deleted.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not delete.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <RequireAuth label="dynamic QR codes">
      <DashboardShell
        title="Dynamic QR Codes"
        description="The QR image always points at an InfyraTools short URL. Change the destination later without reprinting the code."
      >
        <form
          className="space-y-3 rounded-xl border border-line bg-panel p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreate();
          }}
        >
          <h2 className="text-lg font-semibold tracking-tight">Create a dynamic QR</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="qr-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="qr-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Website QR"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="qr-dest" className="text-sm font-medium">
                Destination URL
              </label>
              <Input
                id="qr-dest"
                value={destinationUrl}
                onChange={(event) => setDestinationUrl(event.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <Button
            variant="primary"
            type="submit"
            disabled={creating || !name.trim() || !destinationUrl.trim()}
          >
            {creating ? "Creating…" : "Create QR code"}
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
        {items === null && !error ? (
          <p className="text-sm text-muted">Loading QR codes…</p>
        ) : null}
        {items && items.length === 0 ? (
          <Feedback>
            No dynamic QR codes yet. The free Static QR Generator remains available
            without an account.
          </Feedback>
        ) : null}
        {items && items.length > 0 ? (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-4 lg:flex-row"
              >
                <div className="flex justify-center lg:w-40">
                  {previews[item.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previews[item.id].png}
                      alt={`${item.name} QR code`}
                      className="h-36 w-36 bg-white"
                    />
                  ) : (
                    <p className="text-xs text-muted">Generating image…</p>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted">
                    {item.isActive ? "Active" : "Inactive"} · {item.totalScans} scan
                    {item.totalScans === 1 ? "" : "s"}
                    {item.lastScannedAt ? ` · Last ${formatWhen(item.lastScannedAt)}` : ""}
                  </p>
                  <p className="break-all text-xs text-muted">{item.publicUrl}</p>
                  <p className="break-all text-sm">{item.destinationUrl}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={busyId === item.id}
                      onClick={() => void handleUpdateDestination(item)}
                    >
                      Edit destination
                    </Button>
                    <Button
                      disabled={!previews[item.id]}
                      onClick={() =>
                        previews[item.id] &&
                        downloadDataUrl(previews[item.id].png, `${item.code}.png`)
                      }
                    >
                      Download PNG
                    </Button>
                    <Button
                      disabled={!previews[item.id]}
                      onClick={() =>
                        previews[item.id] &&
                        downloadSvg(previews[item.id].svg, `${item.code}.svg`)
                      }
                    >
                      Download SVG
                    </Button>
                    <Button disabled={busyId === item.id} onClick={() => void handleToggle(item)}>
                      {item.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      disabled={busyId === item.id}
                      onClick={() => void handleDuplicate(item.id)}
                    >
                      Duplicate
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={busyId === item.id}
                      onClick={() => void handleDelete(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </DashboardShell>
    </RequireAuth>
  );
}
