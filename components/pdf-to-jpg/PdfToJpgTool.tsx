"use client";

import { useEffect, useState } from "react";
import JSZip from "jszip";
import { Button } from "@/components/ui/Button";
import { PdfFileDropzone } from "@/components/pdf/PdfFileDropzone";
import { PdfPagePreview } from "@/components/pdf/PdfPagePreview";
import { PdfProcessingStatus } from "@/components/pdf/PdfProcessingStatus";
import {
  PREVIEW_SCALE,
  PdfToolError,
  closePdfJsDocument,
  downloadBlob,
  openPdfJsDocument,
  parsePageRanges,
  readPdfFile,
  renderPdfPageToCanvas,
  renderPdfPageToJpeg,
  revokeObjectUrl,
  type LoadedPdf,
} from "@/lib/tools/pdf-shared";

export default function PdfToJpgTool() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [range, setRange] = useState("");
  const [quality, setQuality] = useState(0.92);
  const [scale, setScale] = useState(1.5);
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
    Object.values(previews).forEach(revokeObjectUrl);
    setPreviews({});
    setSelected(new Set());
    setRange("");
    setError(null);
    setStatus(null);
    setVisibleCount(12);
    try {
      const loaded = await readPdfFile(file);
      setPdf(loaded);
      setSelected(
        new Set(Array.from({ length: loaded.pageCount }, (_, index) => index + 1)),
      );
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

  async function onConvert(asZip: boolean) {
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
    setStatus("Converting pages…");
    try {
      const doc = await openPdfJsDocument(pdf.bytes);
      const blobs: { name: string; blob: Blob }[] = [];
      for (const page of pages) {
        setStatus(`Converting page ${page} of ${pages[pages.length - 1]}…`);
        const blob = await renderPdfPageToJpeg(doc, page, scale, quality);
        blobs.push({ name: `infyratools-page-${page}.jpg`, blob });
      }
      await closePdfJsDocument(doc);

      if (!asZip && blobs.length === 1) {
        downloadBlob(blobs[0].blob, blobs[0].name);
      } else {
        const zip = new JSZip();
        for (const item of blobs) {
          zip.file(item.name, item.blob);
        }
        downloadBlob(await zip.generateAsync({ type: "blob" }), "infyratools-pdf-images.zip");
      }
      setStatus(`Converted ${blobs.length} page${blobs.length === 1 ? "" : "s"} to JPG.`);
    } catch (caught) {
      setStatus(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not convert this PDF to JPG.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-line bg-panel p-4">
      <PdfFileDropzone
        accept="application/pdf,.pdf"
        label="Drop a PDF to convert pages to JPG"
        hint="Choose quality and pages, then download one image or a ZIP."
        disabled={pending}
        onFiles={(files) => void loadFile(files)}
      />
      {pdf ? (
        <>
          <p className="text-sm text-muted">
            {pdf.name} · {pdf.pageCount} pages
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1 text-sm">
              <span className="font-medium">JPG quality</span>
              <select
                className="w-full rounded-md border border-line bg-canvas px-3 py-2"
                value={String(quality)}
                onChange={(event) => setQuality(Number(event.target.value))}
              >
                <option value="0.8">Good (0.8)</option>
                <option value="0.92">High (0.92)</option>
                <option value="1">Max (1.0)</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Render scale</span>
              <select
                className="w-full rounded-md border border-line bg-canvas px-3 py-2"
                value={String(scale)}
                onChange={(event) => setScale(Number(event.target.value))}
              >
                <option value="1">1×</option>
                <option value="1.5">1.5×</option>
                <option value="2">2×</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Page range</span>
              <div className="flex gap-2">
                <input
                  className="w-full rounded-md border border-line bg-canvas px-3 py-2"
                  value={range}
                  placeholder="1-3,5"
                  onChange={(event) => setRange(event.target.value)}
                />
                <Button onClick={applyRange}>Apply</Button>
              </div>
            </label>
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
                  onToggle={() =>
                    setSelected((current) => {
                      const next = new Set(current);
                      if (next.has(page)) {
                        next.delete(page);
                      } else {
                        next.add(page);
                      }
                      return next;
                    })
                  }
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
              onClick={() => void onConvert(selected.size !== 1)}
            >
              {pending
                ? "Converting…"
                : selected.size === 1
                  ? "Download JPG"
                  : "Download JPG ZIP"}
            </Button>
            <Button
              disabled={pending}
              onClick={() => {
                Object.values(previews).forEach(revokeObjectUrl);
                setPdf(null);
                setPreviews({});
                setSelected(new Set());
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
        tone={status?.startsWith("Converted") ? "success" : "empty"}
      />
    </div>
  );
}
