"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PdfFileDropzone } from "@/components/pdf/PdfFileDropzone";
import { PdfPagePreview } from "@/components/pdf/PdfPagePreview";
import { PdfProcessingStatus } from "@/components/pdf/PdfProcessingStatus";
import {
  PREVIEW_SCALE,
  PdfToolError,
  bytesToPdfBlob,
  closePdfJsDocument,
  downloadBlob,
  openPdfJsDocument,
  readPdfFile,
  renderPdfPageToCanvas,
  revokeObjectUrl,
  rotatePdfPages,
  type LoadedPdf,
} from "@/lib/tools/pdf-shared";

export default function RotatePdfTool() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [rotations, setRotations] = useState<Record<number, number>>({});
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
    setRotations({});
    setError(null);
    setStatus(null);
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

  function rotatePage(page: number, amount: number) {
    setRotations((current) => {
      const next = ((current[page] ?? 0) + amount) % 360;
      return { ...current, [page]: next < 0 ? next + 360 : next };
    });
  }

  function rotateAll(amount: number) {
    if (!pdf) {
      return;
    }
    setRotations((current) => {
      const next = { ...current };
      for (let page = 1; page <= pdf.pageCount; page += 1) {
        const value = ((next[page] ?? 0) + amount) % 360;
        next[page] = value < 0 ? value + 360 : value;
      }
      return next;
    });
  }

  async function onDownload() {
    if (!pdf) {
      return;
    }
    setPending(true);
    setError(null);
    setStatus("Applying rotations…");
    try {
      const bytes = await rotatePdfPages(pdf.bytes, rotations);
      downloadBlob(bytesToPdfBlob(bytes), "infyratools-rotated.pdf");
      setStatus("Downloaded rotated PDF.");
    } catch (caught) {
      setStatus(null);
      setError(
        caught instanceof PdfToolError
          ? caught.message
          : "Could not rotate this PDF.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-line bg-panel p-4">
      <PdfFileDropzone
        accept="application/pdf,.pdf"
        label="Drop a PDF to rotate pages"
        hint="Rotate individual pages or the whole document. Text stays vector-based."
        disabled={pending}
        onFiles={(files) => void loadFile(files)}
      />
      {pdf ? (
        <>
          <p className="text-sm text-muted">
            {pdf.name} · {pdf.pageCount} pages
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => rotateAll(90)}>Rotate all 90°</Button>
            <Button onClick={() => rotateAll(180)}>Rotate all 180°</Button>
            <Button onClick={() => rotateAll(270)}>Rotate all 270°</Button>
            <Button onClick={() => setRotations({})}>Reset rotations</Button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: Math.min(visibleCount, pdf.pageCount) }, (_, i) => {
              const page = i + 1;
              const rotation = rotations[page] ?? 0;
              return (
                <PdfPagePreview
                  key={page}
                  pageNumber={page}
                  src={previews[page]}
                  rotation={rotation}
                  badge={rotation ? `${rotation}°` : "0°"}
                >
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Button variant="ghost" onClick={() => rotatePage(page, 90)}>
                      90°
                    </Button>
                    <Button variant="ghost" onClick={() => rotatePage(page, 180)}>
                      180°
                    </Button>
                    <Button variant="ghost" onClick={() => rotatePage(page, 270)}>
                      270°
                    </Button>
                  </div>
                </PdfPagePreview>
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
              disabled={pending}
              onClick={() => void onDownload()}
            >
              {pending ? "Saving…" : "Download rotated PDF"}
            </Button>
            <Button
              disabled={pending}
              onClick={() => {
                Object.values(previews).forEach(revokeObjectUrl);
                setPdf(null);
                setPreviews({});
                setRotations({});
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
        tone={status?.startsWith("Downloaded") ? "success" : "empty"}
      />
    </div>
  );
}
