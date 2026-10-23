"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PdfFileDropzone } from "@/components/pdf/PdfFileDropzone";
import { PdfProcessingStatus } from "@/components/pdf/PdfProcessingStatus";
import {
  PREVIEW_SCALE,
  PdfToolError,
  bytesToPdfBlob,
  closePdfJsDocument,
  createOrganizedPages,
  deleteOrganizedPages,
  downloadBlob,
  duplicateOrganizedPage,
  exportOrganizedPdf,
  formatBytes,
  moveOrganizedPage,
  normalizeRotation,
  openPdfJsDocument,
  readPdfFile,
  renderPdfPageToCanvas,
  revokeObjectUrl,
  type LoadedPdf,
  type OrganizedPage,
} from "@/lib/tools/pdf-shared";
import { cn } from "@/lib/cn";

export default function OrganizePdfTool() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [pages, setPages] = useState<OrganizedPage[]>([]);
  const [initialPages, setInitialPages] = useState<OrganizedPage[]>([]);
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  // Page previews are canvas data URLs (not blob:); no object-URL unmount cleanup needed.

  async function loadFile(files: File[]) {
    const file = files[0];
    if (!file) return;
    Object.values(previews).forEach(revokeObjectUrl);
    setPreviews({});
    setSelected(new Set());
    setError(null);
    setStatus(null);
    try {
      const loaded = await readPdfFile(file);
      const organized = createOrganizedPages(loaded.pageCount);
      setPdf(loaded);
      setPages(organized);
      setInitialPages(organized.map((page) => ({ ...page })));
      setStatus(
        `Loaded ${loaded.name} · ${formatBytes(loaded.size)} · ${loaded.pageCount} pages.`,
      );
      void buildPreviews(loaded);
    } catch (caught) {
      setPdf(null);
      setPages([]);
      setInitialPages([]);
      setError(
        caught instanceof PdfToolError
          ? caught.message
          : `Could not read "${file.name}".`,
      );
    }
  }

  async function buildPreviews(loaded: LoadedPdf) {
    try {
      const doc = await openPdfJsDocument(loaded.bytes);
      const next: Record<number, string> = {};
      const limit = Math.min(loaded.pageCount, 40);
      for (let page = 1; page <= limit; page += 1) {
        const canvas = await renderPdfPageToCanvas(doc, page, PREVIEW_SCALE);
        next[page - 1] = canvas.toDataURL("image/jpeg", 0.72);
        canvas.width = 0;
        canvas.height = 0;
      }
      await closePdfJsDocument(doc);
      setPreviews((current) => {
        Object.values(current).forEach(revokeObjectUrl);
        return next;
      });
    } catch {
      setError("Could not render page previews for this PDF.");
    }
  }

  function toggleSelect(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function rotateSelected(amount: number) {
    setPages((current) =>
      current.map((page) =>
        selected.has(page.id)
          ? { ...page, rotation: normalizeRotation(page.rotation + amount) }
          : page,
      ),
    );
  }

  function rotateOne(id: string, amount: number) {
    setPages((current) =>
      current.map((page) =>
        page.id === id
          ? { ...page, rotation: normalizeRotation(page.rotation + amount) }
          : page,
      ),
    );
  }

  async function onExport() {
    if (!pdf) return;
    if (pages.length === 0) {
      setError("Keep at least one page before exporting.");
      return;
    }
    setPending(true);
    setError(null);
    setStatus("Building organized PDF…");
    try {
      const bytes = await exportOrganizedPdf(pdf.bytes, pages);
      downloadBlob(bytesToPdfBlob(bytes), "infyratools-organized.pdf");
      setStatus(`Downloaded organized PDF (${pages.length} pages).`);
    } catch (caught) {
      setStatus(null);
      setError(
        caught instanceof PdfToolError
          ? caught.message
          : "Could not export the organized PDF.",
      );
    } finally {
      setPending(false);
    }
  }

  function resetAll() {
    Object.values(previews).forEach(revokeObjectUrl);
    setPdf(null);
    setPages([]);
    setInitialPages([]);
    setPreviews({});
    setSelected(new Set());
    setError(null);
    setStatus(null);
  }

  function resetLayout() {
    setPages(createOrganizedPages(initialPages.length || pdf?.pageCount || 0));
    setSelected(new Set());
    setStatus("Page layout reset to the original order.");
  }

  return (
    <div className="min-w-0 max-w-full space-y-4 rounded-xl border border-line bg-panel p-4">
      <PdfFileDropzone
        accept="application/pdf,.pdf"
        label="Drop a PDF to organize pages"
        hint="Reorder, delete, duplicate, and rotate pages. Processing stays in your browser."
        disabled={pending}
        onFiles={(files) => void loadFile(files)}
      />

      {pdf ? (
        <>
          <p className="text-sm text-muted">
            {pdf.name} · {formatBytes(pdf.size)} · {pages.length} page
            {pages.length === 1 ? "" : "s"} in current layout
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                const id = [...selected][0];
                if (!id) return;
                const index = pages.findIndex((page) => page.id === id);
                setPages(moveOrganizedPage(pages, id, index - 1));
              }}
              disabled={pending || selected.size !== 1}
            >
              Move left
            </Button>
            <Button
              onClick={() => {
                const id = [...selected][0];
                if (!id) return;
                const index = pages.findIndex((page) => page.id === id);
                setPages(moveOrganizedPage(pages, id, index + 1));
              }}
              disabled={pending || selected.size !== 1}
            >
              Move right
            </Button>
            <Button
              onClick={() => {
                const id = [...selected][0];
                if (!id) return;
                setPages(duplicateOrganizedPage(pages, id));
              }}
              disabled={pending || selected.size !== 1}
            >
              Duplicate
            </Button>
            <Button
              onClick={() => {
                if (selected.size === 0) return;
                const next = deleteOrganizedPages(pages, selected);
                if (next.length === 0) {
                  setError("Keep at least one page, or reset the document.");
                  return;
                }
                setPages(next);
                setSelected(new Set());
              }}
              disabled={pending || selected.size === 0}
            >
              Delete selected
            </Button>
            <Button onClick={() => rotateSelected(90)} disabled={pending || selected.size === 0}>
              Rotate CW
            </Button>
            <Button onClick={() => rotateSelected(-90)} disabled={pending || selected.size === 0}>
              Rotate CCW
            </Button>
            <Button onClick={resetLayout} disabled={pending}>
              Reset layout
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {pages.map((page, index) => (
              <div
                key={page.id}
                draggable={!pending}
                onDragStart={() => setDragId(page.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (!dragId) return;
                  setPages(moveOrganizedPage(pages, dragId, index));
                  setDragId(null);
                }}
                className={cn(
                  "rounded-lg border p-2",
                  selected.has(page.id)
                    ? "border-brand bg-brand-soft"
                    : "border-line bg-panel",
                )}
              >
                <button
                  type="button"
                  className="w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  onClick={() => toggleSelect(page.id)}
                  aria-pressed={selected.has(page.id)}
                >
                  <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-md bg-canvas">
                    {previews[page.sourceIndex] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previews[page.sourceIndex]}
                        alt={`Source page ${page.sourceIndex + 1}`}
                        className="max-h-full max-w-full object-contain"
                        style={{
                          transform: page.rotation
                            ? `rotate(${page.rotation}deg)`
                            : undefined,
                        }}
                      />
                    ) : (
                      <span className="text-xs text-muted">
                        Page {page.sourceIndex + 1}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium">
                      Src {page.sourceIndex + 1}
                    </span>
                    <span className="text-muted">
                      #{index + 1} · {page.rotation}°
                    </span>
                  </div>
                </button>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Button
                    className="!px-2 !py-1 text-xs"
                    aria-label={`Move page ${index + 1} left`}
                    onClick={() =>
                      setPages(moveOrganizedPage(pages, page.id, index - 1))
                    }
                    disabled={pending || index === 0}
                  >
                    ←
                  </Button>
                  <Button
                    className="!px-2 !py-1 text-xs"
                    aria-label={`Move page ${index + 1} right`}
                    onClick={() =>
                      setPages(moveOrganizedPage(pages, page.id, index + 1))
                    }
                    disabled={pending || index === pages.length - 1}
                  >
                    →
                  </Button>
                  <Button
                    className="!px-2 !py-1 text-xs"
                    aria-label={`Rotate page ${index + 1}`}
                    onClick={() => rotateOne(page.id, 90)}
                    disabled={pending}
                  >
                    90°
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() => void onExport()}
              disabled={pending || pages.length === 0}
            >
              {pending ? "Working…" : "Download organized PDF"}
            </Button>
            <Button onClick={resetAll} disabled={pending}>
              Reset
            </Button>
          </div>
        </>
      ) : null}

      <PdfProcessingStatus message={error} tone="error" />
      <PdfProcessingStatus message={status} tone="success" />
    </div>
  );
}
