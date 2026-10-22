"use client";

import { useEffect, useState } from "react";
import JSZip from "jszip";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PdfFileDropzone } from "@/components/pdf/PdfFileDropzone";
import { PdfPagePreview } from "@/components/pdf/PdfPagePreview";
import { PdfProcessingStatus } from "@/components/pdf/PdfProcessingStatus";
import {
  PdfToolError,
  bytesToPdfBlob,
  closePdfJsDocument,
  downloadBlob,
  extractPages,
  openPdfJsDocument,
  parsePageRanges,
  readPdfFile,
  renderPdfPageToCanvas,
  revokeObjectUrl,
  splitPagesToBuffers,
  type LoadedPdf,
  PREVIEW_SCALE,
} from "@/lib/tools/pdf-shared";

export default function SplitPdfTool() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [range, setRange] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    return () => {
      Object.values(previews).forEach(revokeObjectUrl);
    };
  }, [previews]);

  async function loadFile(files: File[]) {
    const file = files[0];
    if (!file) {
      return;
    }
    setError(null);
    setStatus(null);
    Object.values(previews).forEach(revokeObjectUrl);
    setPreviews({});
    setSelected(new Set());
    setRange("");
    setVisibleCount(12);
    try {
      const loaded = await readPdfFile(file);
      setPdf(loaded);
      setStatus(`Loaded ${loaded.pageCount} page${loaded.pageCount === 1 ? "" : "s"}.`);
      void buildPreviews(loaded, Math.min(12, loaded.pageCount));
    } catch (caught) {
      setPdf(null);
      setError(
        caught instanceof PdfToolError
          ? caught.message
          : `Could not read "${file.name}".`,
      );
    }
  }

  async function buildPreviews(loaded: LoadedPdf, count: number) {
    try {
      const doc = await openPdfJsDocument(loaded.bytes);
      const next: Record<number, string> = {};
      for (let page = 1; page <= count; page += 1) {
        const canvas = await renderPdfPageToCanvas(doc, page, PREVIEW_SCALE);
        next[page] = canvas.toDataURL("image/jpeg", 0.72);
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

  function applyRange() {
    if (!pdf) {
      return;
    }
    const parsed = parsePageRanges(range, pdf.pageCount);
    if (parsed.error) {
      setError(parsed.error);
      return;
    }
    setError(null);
    setSelected(new Set(parsed.pages));
  }

  function togglePage(page: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(page)) {
        next.delete(page);
      } else {
        next.add(page);
      }
      return next;
    });
  }

  async function onExtract(asZip: boolean) {
    if (!pdf) {
      return;
    }
    const pages = [...selected].sort((a, b) => a - b);
    if (pages.length === 0) {
      setError("Select at least one page.");
      return;
    }
    setPending(true);
    setError(null);
    setStatus(asZip ? "Building ZIP…" : "Extracting pages…");
    try {
      if (asZip) {
        const parts = await splitPagesToBuffers(pdf.bytes, pages);
        const zip = new JSZip();
        for (const part of parts) {
          zip.file(part.name, part.data);
        }
        const blob = await zip.generateAsync({ type: "blob" });
        downloadBlob(blob, "infyratools-split-pages.zip");
        setStatus(`Downloaded ${pages.length} separate PDFs in a ZIP.`);
      } else {
        const bytes = await extractPages(pdf.bytes, pages);
        downloadBlob(bytesToPdfBlob(bytes), "infyratools-extracted.pdf");
        setStatus(`Extracted ${pages.length} page${pages.length === 1 ? "" : "s"}.`);
      }
    } catch (caught) {
      setStatus(null);
      setError(
        caught instanceof PdfToolError
          ? caught.message
          : "Could not split this PDF.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-line bg-panel p-4">
      <PdfFileDropzone
        accept="application/pdf,.pdf"
        label="Drop a PDF to split or extract pages"
        hint="Select pages or enter a range like 1-3,5,8-10."
        disabled={pending}
        onFiles={(files) => void loadFile(files)}
      />
      {pdf ? (
        <>
          <p className="text-sm text-muted">
            {pdf.name} · {pdf.pageCount} pages
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1 space-y-1">
              <label htmlFor="split-range" className="text-sm font-medium">
                Page range
              </label>
              <Input
                id="split-range"
                value={range}
                placeholder="1-3,5,8-10"
                onChange={(event) => setRange(event.target.value)}
              />
            </div>
            <Button onClick={applyRange}>Apply range</Button>
            <Button
              onClick={() =>
                setSelected(
                  new Set(
                    Array.from({ length: pdf.pageCount }, (_, index) => index + 1),
                  ),
                )
              }
            >
              Select all
            </Button>
            <Button onClick={() => setSelected(new Set())}>Clear selection</Button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: Math.min(visibleCount, pdf.pageCount) }, (_, i) => {
              const page = i + 1;
              return (
                <PdfPagePreview
                  key={page}
                  pageNumber={page}
                  src={previews[page]}
                  selected={selected.has(page)}
                  onToggle={() => togglePage(page)}
                />
              );
            })}
          </div>
          {visibleCount < pdf.pageCount ? (
            <Button
              onClick={() => {
                const next = Math.min(visibleCount + 12, pdf.pageCount);
                setVisibleCount(next);
                void buildPreviews(pdf, next);
              }}
            >
              Load more previews
            </Button>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              disabled={pending || selected.size === 0}
              onClick={() => void onExtract(false)}
            >
              {pending ? "Working…" : "Extract to one PDF"}
            </Button>
            <Button
              disabled={pending || selected.size === 0}
              onClick={() => void onExtract(true)}
            >
              Download pages as ZIP
            </Button>
            <Button
              disabled={pending}
              onClick={() => {
                Object.values(previews).forEach(revokeObjectUrl);
                setPdf(null);
                setPreviews({});
                setSelected(new Set());
                setRange("");
                setError(null);
                setStatus(null);
              }}
            >
              Reset
            </Button>
          </div>
        </>
      ) : null}
      <PdfProcessingStatus message={error} tone="error" />
      <PdfProcessingStatus
        message={status}
        tone={status?.startsWith("Downloaded") || status?.startsWith("Extracted") ? "success" : "empty"}
      />
    </div>
  );
}
