"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PdfFileDropzone } from "@/components/pdf/PdfFileDropzone";
import { PdfPagePreview } from "@/components/pdf/PdfPagePreview";
import { PdfProcessingStatus } from "@/components/pdf/PdfProcessingStatus";
import {
  PREVIEW_SCALE,
  PdfToolError,
  applyWatermark,
  bytesToPdfBlob,
  closePdfJsDocument,
  colorFromHex,
  downloadBlob,
  formatBytes,
  isImageMime,
  openPdfJsDocument,
  readPdfFile,
  renderPdfPageToCanvas,
  revokeObjectUrl,
  watermarkPlacement,
  type LoadedPdf,
  type WatermarkPageTarget,
  type WatermarkPosition,
} from "@/lib/tools/pdf-shared";

type Mode = "text" | "image";

export default function WatermarkPdfTool() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#737373");
  const [opacity, setOpacity] = useState(0.35);
  const [rotation, setRotation] = useState(-30);
  const [position, setPosition] = useState<WatermarkPosition>("center");
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [imageScale, setImageScale] = useState(0.35);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pageMode, setPageMode] = useState<"all" | "first" | "last" | "range">(
    "all",
  );
  const [range, setRange] = useState("1-3");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const imagePreviewRef = useRef(imagePreview);
  imagePreviewRef.current = imagePreview;

  useEffect(() => {
    return () => {
      // Unmount only — replace/reset revoke explicitly. Page previews are data URLs.
      revokeObjectUrl(imagePreviewRef.current);
    };
  }, []);

  const overlayStyle = useMemo(() => {
    const pageWidth = 300;
    const pageHeight = 400;
    const contentWidth = mode === "text" ? Math.min(220, text.length * 10) : 120;
    const contentHeight = mode === "text" ? 28 : 80;
    const place = watermarkPlacement(
      pageWidth,
      pageHeight,
      contentWidth,
      contentHeight,
      position,
      offsetX * 0.5,
      offsetY * 0.5,
    );
    // Convert PDF bottom-left to CSS top-left inside a 300x400 box
    return {
      left: `${(place.x / pageWidth) * 100}%`,
      bottom: `${(place.y / pageHeight) * 100}%`,
      opacity,
      transform: `rotate(${rotation}deg)`,
      width: contentWidth,
    } as const;
  }, [mode, text, position, offsetX, offsetY, opacity, rotation]);

  async function loadPdf(files: File[]) {
    const file = files[0];
    if (!file) return;
    Object.values(previews).forEach(revokeObjectUrl);
    setPreviews({});
    setError(null);
    setStatus(null);
    try {
      const loaded = await readPdfFile(file);
      setPdf(loaded);
      setStatus(
        `Loaded ${loaded.name} · ${formatBytes(loaded.size)} · ${loaded.pageCount} pages.`,
      );
      void buildPreviews(loaded);
    } catch (caught) {
      setPdf(null);
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
      const limit = Math.min(loaded.pageCount, 8);
      for (let page = 1; page <= limit; page += 1) {
        const canvas = await renderPdfPageToCanvas(doc, page, PREVIEW_SCALE);
        next[page] = canvas.toDataURL("image/jpeg", 0.7);
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

  function onImage(files: File[]) {
    const file = files[0];
    if (!file) return;
    if (!isImageMime(file)) {
      setError("Watermark image must be JPG or PNG.");
      return;
    }
    revokeObjectUrl(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  }

  function pageTarget(): WatermarkPageTarget {
    if (pageMode === "range") return { mode: "range", expression: range };
    return { mode: pageMode };
  }

  async function onApply() {
    if (!pdf) return;
    setPending(true);
    setError(null);
    setStatus("Applying watermark…");
    try {
      let bytes: Uint8Array;
      if (mode === "text") {
        if (!text.trim()) {
          throw new PdfToolError("Enter watermark text.");
        }
        bytes = await applyWatermark(pdf.bytes, pageTarget(), {
          kind: "text",
          text,
          fontSize,
          color: colorFromHex(color),
          opacity,
          rotation,
          position,
          offsetX,
          offsetY,
        });
      } else {
        if (!imageFile) {
          throw new PdfToolError("Upload a JPG or PNG watermark image.");
        }
        bytes = await applyWatermark(pdf.bytes, pageTarget(), {
          kind: "image",
          bytes: await imageFile.arrayBuffer(),
          mime: imageFile.type || "image/png",
          name: imageFile.name,
          scale: imageScale,
          opacity,
          rotation,
          position,
          offsetX,
          offsetY,
        });
      }
      downloadBlob(bytesToPdfBlob(bytes), "infyratools-watermarked.pdf");
      setStatus("Downloaded watermarked PDF.");
    } catch (caught) {
      setStatus(null);
      setError(
        caught instanceof PdfToolError
          ? caught.message
          : "Could not apply the watermark.",
      );
    } finally {
      setPending(false);
    }
  }

  function reset() {
    Object.values(previews).forEach(revokeObjectUrl);
    revokeObjectUrl(imagePreview);
    setPdf(null);
    setPreviews({});
    setImageFile(null);
    setImagePreview(null);
    setError(null);
    setStatus(null);
  }

  return (
    <div className="min-w-0 max-w-full space-y-4 rounded-xl border border-line bg-panel p-4">
      <PdfFileDropzone
        accept="application/pdf,.pdf"
        label="Drop a PDF to watermark"
        hint="Add text or an image watermark. Files stay in your browser."
        disabled={pending}
        onFiles={(files) => void loadPdf(files)}
      />

      {pdf ? (
        <>
          <p className="text-sm text-muted">
            {pdf.name} · {pdf.pageCount} pages
          </p>

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={mode === "text" ? "primary" : "secondary"}
                  onClick={() => setMode("text")}
                >
                  Text watermark
                </Button>
                <Button
                  variant={mode === "image" ? "primary" : "secondary"}
                  onClick={() => setMode("image")}
                >
                  Image watermark
                </Button>
              </div>

              {mode === "text" ? (
                <label className="block space-y-1 text-sm">
                  <span className="font-medium">Watermark text</span>
                  <Input value={text} onChange={(e) => setText(e.target.value)} />
                </label>
              ) : (
                <PdfFileDropzone
                  accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                  label="Drop a JPG or PNG watermark"
                  onFiles={onImage}
                  disabled={pending}
                />
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                {mode === "text" ? (
                  <>
                    <label className="block space-y-1 text-sm">
                      <span className="font-medium">Font size</span>
                      <Input
                        type="number"
                        min={8}
                        max={200}
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value) || 48)}
                      />
                    </label>
                    <label className="block space-y-1 text-sm">
                      <span className="font-medium">Color</span>
                      <Input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                      />
                    </label>
                  </>
                ) : (
                  <label className="block space-y-1 text-sm sm:col-span-2">
                    <span className="font-medium">Image scale</span>
                    <Input
                      type="range"
                      min={0.05}
                      max={1.5}
                      step={0.05}
                      value={imageScale}
                      onChange={(e) => setImageScale(Number(e.target.value))}
                    />
                    <span className="text-xs text-muted">{imageScale.toFixed(2)}×</span>
                  </label>
                )}
                <label className="block space-y-1 text-sm">
                  <span className="font-medium">Opacity</span>
                  <Input
                    type="range"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="font-medium">Rotation</span>
                  <Input
                    type="number"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value) || 0)}
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="font-medium">Position</span>
                  <select
                    className="w-full rounded-md border border-line bg-panel px-3 py-2"
                    value={position}
                    onChange={(e) =>
                      setPosition(e.target.value as WatermarkPosition)
                    }
                  >
                    <option value="center">Center</option>
                    <option value="top-left">Top left</option>
                    <option value="top-right">Top right</option>
                    <option value="bottom-left">Bottom left</option>
                    <option value="bottom-right">Bottom right</option>
                  </select>
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="font-medium">Pages</span>
                  <select
                    className="w-full rounded-md border border-line bg-panel px-3 py-2"
                    value={pageMode}
                    onChange={(e) =>
                      setPageMode(e.target.value as typeof pageMode)
                    }
                  >
                    <option value="all">All pages</option>
                    <option value="first">First page</option>
                    <option value="last">Last page</option>
                    <option value="range">Custom range</option>
                  </select>
                </label>
                {pageMode === "range" ? (
                  <label className="block space-y-1 text-sm sm:col-span-2">
                    <span className="font-medium">Page range</span>
                    <Input
                      value={range}
                      placeholder="1-3,5"
                      onChange={(e) => setRange(e.target.value)}
                    />
                  </label>
                ) : null}
                <label className="block space-y-1 text-sm">
                  <span className="font-medium">Offset X</span>
                  <Input
                    type="number"
                    value={offsetX}
                    onChange={(e) => setOffsetX(Number(e.target.value) || 0)}
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="font-medium">Offset Y</span>
                  <Input
                    type="number"
                    value={offsetY}
                    onChange={(e) => setOffsetY(Number(e.target.value) || 0)}
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  onClick={() => void onApply()}
                  disabled={pending}
                >
                  {pending ? "Working…" : "Download watermarked PDF"}
                </Button>
                <Button onClick={reset} disabled={pending}>
                  Reset
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Preview</p>
              <div className="relative overflow-hidden rounded-lg border border-line bg-canvas">
                {previews[1] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previews[1]} alt="Page 1 preview" className="w-full" />
                ) : (
                  <div className="aspect-[3/4] bg-canvas" />
                )}
                <div
                  className="pointer-events-none absolute origin-bottom-left text-center font-bold tracking-wide"
                  style={{
                    ...overlayStyle,
                    color: mode === "text" ? color : undefined,
                    fontSize: mode === "text" ? 18 : undefined,
                  }}
                >
                  {mode === "text" ? (
                    text || "Watermark"
                  ) : imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagePreview} alt="" className="max-w-full" />
                  ) : (
                    "Image"
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(previews)
                  .slice(0, 4)
                  .map(([page, src]) => (
                    <PdfPagePreview
                      key={page}
                      pageNumber={Number(page)}
                      src={src}
                    />
                  ))}
              </div>
            </div>
          </div>
        </>
      ) : null}

      <PdfProcessingStatus message={error} tone="error" />
      <PdfProcessingStatus message={status} tone="success" />
    </div>
  );
}
