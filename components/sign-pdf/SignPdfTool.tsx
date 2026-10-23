"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PdfFileDropzone } from "@/components/pdf/PdfFileDropzone";
import { PdfProcessingStatus } from "@/components/pdf/PdfProcessingStatus";
import {
  PREVIEW_SCALE,
  PdfToolError,
  bytesToPdfBlob,
  closePdfJsDocument,
  downloadBlob,
  embedSignatures,
  formatBytes,
  isImageMime,
  openPdfJsDocument,
  readPdfFile,
  renderPdfPageToCanvas,
  renderTypedSignaturePng,
  revokeObjectUrl,
  type LoadedPdf,
  type SignaturePlacement,
} from "@/lib/tools/pdf-shared";

type Mode = "draw" | "type" | "upload";

type PlacedSignature = SignaturePlacement & { id: string };

const SIGNATURE_FONTS = [
  { id: "cursive", label: "Cursive", family: "\"Segoe Script\", \"Brush Script MT\", cursive" },
  { id: "serif", label: "Elegant serif", family: "Georgia, \"Times New Roman\", serif" },
  { id: "sans", label: "Modern sans", family: "system-ui, sans-serif" },
] as const;

export default function SignPdfTool() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [pagePreviews, setPagePreviews] = useState<Record<number, string>>({});
  const [activePage, setActivePage] = useState(1);
  const [mode, setMode] = useState<Mode>("draw");
  const [typedName, setTypedName] = useState("");
  const [fontId, setFontId] = useState<(typeof SIGNATURE_FONTS)[number]["id"]>("cursive");
  const [inkColor, setInkColor] = useState("#111827");
  const [strokeWidth, setStrokeWidth] = useState(2.5);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [signatureBytes, setSignatureBytes] = useState<ArrayBuffer | null>(null);
  const [signatureMime, setSignatureMime] = useState("image/png");
  const [placements, setPlacements] = useState<PlacedSignature[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const signatureUrlRef = useRef<string | null>(null);
  signatureUrlRef.current = signatureUrl;
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origLeft: number;
    origTop: number;
  } | null>(null);
  const resizeRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origLeft: number;
    origTop: number;
    origWidth: number;
    origHeight: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      // Unmount only — replace/reset revoke explicitly. Page previews are data URLs.
      revokeObjectUrl(signatureUrlRef.current);
    };
  }, []);

  async function loadPdf(files: File[]) {
    const file = files[0];
    if (!file) return;
    Object.values(pagePreviews).forEach(revokeObjectUrl);
    setPagePreviews({});
    setPlacements([]);
    setActivePage(1);
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
      const limit = Math.min(loaded.pageCount, 24);
      for (let page = 1; page <= limit; page += 1) {
        const canvas = await renderPdfPageToCanvas(doc, page, PREVIEW_SCALE);
        next[page] = canvas.toDataURL("image/jpeg", 0.72);
        canvas.width = 0;
        canvas.height = 0;
      }
      await closePdfJsDocument(doc);
      setPagePreviews((current) => {
        Object.values(current).forEach(revokeObjectUrl);
        return next;
      });
    } catch {
      setError("Could not render page previews for this PDF.");
    }
  }

  function setupCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 480;
    const height = 160;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = inkColor;
    context.lineWidth = strokeWidth;
    context.clearRect(0, 0, width, height);
  }

  useEffect(() => {
    if (mode === "draw") {
      setupCanvas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, inkColor, strokeWidth]);

  function pointerPos(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    drawing.current = true;
    const { x, y } = pointerPos(event);
    context.beginPath();
    context.moveTo(x, y);
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    event.preventDefault();
    const { x, y } = pointerPos(event);
    context.lineTo(x, y);
    context.stroke();
  }

  function onPointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = false;
    canvasRef.current?.releasePointerCapture(event.pointerId);
  }

  async function commitDrawnSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) {
      setError("Could not capture the drawn signature.");
      return;
    }
    revokeObjectUrl(signatureUrl);
    const buffer = await blob.arrayBuffer();
    setSignatureBytes(buffer);
    setSignatureMime("image/png");
    setSignatureUrl(URL.createObjectURL(blob));
    setStatus("Drawn signature ready. Place it on a page.");
  }

  async function commitTypedSignature() {
    try {
      const font = SIGNATURE_FONTS.find((item) => item.id === fontId) ?? SIGNATURE_FONTS[0];
      const buffer = await renderTypedSignaturePng(typedName, font.family, inkColor);
      revokeObjectUrl(signatureUrl);
      setSignatureBytes(buffer);
      setSignatureMime("image/png");
      setSignatureUrl(
        URL.createObjectURL(
          new Blob([new Uint8Array(buffer)], { type: "image/png" }),
        ),
      );
      setStatus("Typed signature ready. Place it on a page.");
    } catch (caught) {
      setError(
        caught instanceof PdfToolError
          ? caught.message
          : "Could not create the typed signature.",
      );
    }
  }

  async function commitUploadedSignature(files: File[]) {
    const file = files[0];
    if (!file) return;
    if (!isImageMime(file)) {
      setError("Upload a PNG or JPG signature image.");
      return;
    }
    revokeObjectUrl(signatureUrl);
    setSignatureBytes(await file.arrayBuffer());
    setSignatureMime(file.type || "image/png");
    setSignatureUrl(URL.createObjectURL(file));
    setStatus("Uploaded signature ready. Place it on a page.");
  }

  function placeSignature() {
    if (!signatureUrl || !previewRef.current) {
      setError("Create or upload a signature first.");
      return;
    }
    const rect = previewRef.current.getBoundingClientRect();
    const width = Math.min(160, rect.width * 0.35);
    const height = width * 0.4;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sig-${Date.now()}`;
    setPlacements((current) => [
      ...current,
      {
        id,
        page: activePage,
        left: rect.width * 0.1,
        top: rect.height * 0.65,
        width,
        height,
        previewWidth: rect.width,
        previewHeight: rect.height,
      },
    ]);
    setError(null);
  }

  function onSigPointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    placement: PlacedSignature,
  ) {
    // Ignore presses that start on the resize handle (it stops propagation).
    event.preventDefault();
    resizeRef.current = null;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id: placement.id,
      startX: event.clientX,
      startY: event.clientY,
      origLeft: placement.left,
      origTop: placement.top,
    };
  }

  function clampPlacement(
    left: number,
    top: number,
    width: number,
    height: number,
    boundsWidth: number,
    boundsHeight: number,
  ) {
    const nextWidth = Math.min(Math.max(width, 48), boundsWidth);
    const nextHeight = Math.min(Math.max(height, 24), boundsHeight);
    return {
      left: Math.min(Math.max(left, 0), Math.max(boundsWidth - nextWidth, 0)),
      top: Math.min(Math.max(top, 0), Math.max(boundsHeight - nextHeight, 0)),
      width: nextWidth,
      height: nextHeight,
    };
  }

  function onSigPointerMove(event: React.PointerEvent<HTMLElement>) {
    const bounds = previewRef.current?.getBoundingClientRect();
    if (!bounds) return;

    const resize = resizeRef.current;
    if (resize) {
      event.preventDefault();
      const dx = event.clientX - resize.startX;
      const aspect =
        resize.origHeight > 0 ? resize.origWidth / resize.origHeight : 2.5;
      const maxWidth = Math.max(bounds.width - resize.origLeft, 48);
      const maxHeight = Math.max(bounds.height - resize.origTop, 24);
      let nextWidth = Math.min(Math.max(resize.origWidth + dx, 48), maxWidth);
      let nextHeight = nextWidth / aspect;
      if (nextHeight > maxHeight) {
        nextHeight = maxHeight;
        nextWidth = Math.min(nextHeight * aspect, maxWidth);
      }
      const clamped = clampPlacement(
        resize.origLeft,
        resize.origTop,
        nextWidth,
        nextHeight,
        bounds.width,
        bounds.height,
      );
      setPlacements((current) =>
        current.map((item) =>
          item.id !== resize.id
            ? item
            : {
                ...item,
                ...clamped,
                previewWidth: bounds.width,
                previewHeight: bounds.height,
              },
        ),
      );
      return;
    }

    const drag = dragRef.current;
    if (!drag) return;
    event.preventDefault();
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    setPlacements((current) =>
      current.map((item) => {
        if (item.id !== drag.id) return item;
        const clamped = clampPlacement(
          drag.origLeft + dx,
          drag.origTop + dy,
          item.width,
          item.height,
          bounds.width,
          bounds.height,
        );
        return {
          ...item,
          ...clamped,
          previewWidth: bounds.width,
          previewHeight: bounds.height,
        };
      }),
    );
  }

  function onSigPointerUp(event: React.PointerEvent<HTMLElement>) {
    dragRef.current = null;
    resizeRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer may already have been released.
    }
  }

  function onResizePointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
    placement: PlacedSignature,
  ) {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = null;
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeRef.current = {
      id: placement.id,
      startX: event.clientX,
      startY: event.clientY,
      origLeft: placement.left,
      origTop: placement.top,
      origWidth: placement.width,
      origHeight: placement.height,
    };
  }

  async function onExport() {
    if (!pdf || !signatureBytes) {
      setError("Add a signature and place it before downloading.");
      return;
    }
    if (placements.length === 0) {
      setError("Place at least one signature on the document.");
      return;
    }
    setPending(true);
    setError(null);
    setStatus("Embedding signature…");
    try {
      // Refresh live preview metrics for placements on the active page only
      // (other pages keep the metrics captured when they were last edited).
      const previewBox = previewRef.current?.getBoundingClientRect();
      const exportPlacements = placements.map((placement) => {
        if (
          !previewBox ||
          placement.page !== activePage ||
          placement.previewWidth <= 0 ||
          placement.previewHeight <= 0
        ) {
          return placement;
        }
        const scaleX = previewBox.width / placement.previewWidth;
        const scaleY = previewBox.height / placement.previewHeight;
        return {
          page: placement.page,
          left: placement.left * scaleX,
          top: placement.top * scaleY,
          width: placement.width * scaleX,
          height: placement.height * scaleY,
          previewWidth: previewBox.width,
          previewHeight: previewBox.height,
        };
      });
      const bytes = await embedSignatures(
        pdf.bytes,
        {
          bytes: signatureBytes,
          mime: signatureMime,
          name: "signature.png",
        },
        exportPlacements,
      );
      downloadBlob(bytesToPdfBlob(bytes), "infyratools-signed.pdf");
      setStatus("Downloaded signed PDF.");
    } catch (caught) {
      setStatus(null);
      setError(
        caught instanceof PdfToolError
          ? caught.message
          : "Could not sign this PDF.",
      );
    } finally {
      setPending(false);
    }
  }

  function reset() {
    Object.values(pagePreviews).forEach(revokeObjectUrl);
    revokeObjectUrl(signatureUrl);
    setPdf(null);
    setPagePreviews({});
    setPlacements([]);
    setSignatureBytes(null);
    setSignatureUrl(null);
    setTypedName("");
    setError(null);
    setStatus(null);
    setupCanvas();
  }

  const pagePlacements = placements.filter((item) => item.page === activePage);

  return (
    <div className="min-w-0 max-w-full space-y-4 rounded-xl border border-line bg-panel p-4">
      <p className="text-sm text-muted">
        Adds a visible electronic signature only. This is not a certificate-backed
        cryptographic digital signature or identity verification service.
      </p>

      <PdfFileDropzone
        accept="application/pdf,.pdf"
        label="Drop a PDF to sign"
        hint="Create a signature, place it on a page, then download. Nothing is uploaded."
        disabled={pending}
        onFiles={(files) => void loadPdf(files)}
      />

      {pdf ? (
        <>
          <p className="text-sm text-muted">
            {pdf.name} · {pdf.pageCount} pages · signing page {activePage}
          </p>

          <div className="flex flex-wrap gap-2">
            {(["draw", "type", "upload"] as Mode[]).map((item) => (
              <Button
                key={item}
                variant={mode === item ? "primary" : "secondary"}
                onClick={() => setMode(item)}
              >
                {item === "draw"
                  ? "Draw"
                  : item === "type"
                    ? "Type"
                    : "Upload"}
              </Button>
            ))}
          </div>

          {mode === "draw" ? (
            <div className="space-y-2">
              <canvas
                ref={canvasRef}
                className="h-40 w-full touch-none rounded-md border border-line bg-white"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
              />
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-sm">
                  Stroke
                  <Input
                    type="range"
                    min={1}
                    max={8}
                    step={0.5}
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  />
                </label>
                <label className="text-sm">
                  Color
                  <Input
                    type="color"
                    value={inkColor}
                    onChange={(e) => setInkColor(e.target.value)}
                  />
                </label>
                <Button onClick={() => setupCanvas()}>Clear</Button>
                <Button variant="primary" onClick={() => void commitDrawnSignature()}>
                  Use drawn signature
                </Button>
              </div>
            </div>
          ) : null}

          {mode === "type" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Name</span>
                <Input
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Your name"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Style</span>
                <select
                  className="w-full rounded-md border border-line bg-panel px-3 py-2"
                  value={fontId}
                  onChange={(e) =>
                    setFontId(e.target.value as typeof fontId)
                  }
                >
                  {SIGNATURE_FONTS.map((font) => (
                    <option key={font.id} value={font.id}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                variant="primary"
                onClick={() => void commitTypedSignature()}
              >
                Use typed signature
              </Button>
            </div>
          ) : null}

          {mode === "upload" ? (
            <PdfFileDropzone
              accept="image/png,image/jpeg,.png,.jpg,.jpeg"
              label="Drop a PNG or JPG signature"
              onFiles={(files) => void commitUploadedSignature(files)}
              disabled={pending}
            />
          ) : null}

          {signatureUrl ? (
            <div className="flex items-center gap-3 rounded-md border border-line p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signatureUrl}
                alt="Signature preview"
                className="h-12 max-w-[180px] object-contain"
              />
              <Button onClick={placeSignature}>Place on page {activePage}</Button>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {Array.from({ length: pdf.pageCount }, (_, index) => index + 1)
              .slice(0, 24)
              .map((page) => (
                <Button
                  key={page}
                  variant={activePage === page ? "primary" : "secondary"}
                  onClick={() => setActivePage(page)}
                >
                  Page {page}
                </Button>
              ))}
          </div>

          <div
            ref={previewRef}
            className="relative overflow-hidden rounded-lg border border-line bg-canvas"
          >
            {pagePreviews[activePage] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pagePreviews[activePage]}
                alt={`Page ${activePage}`}
                className="block w-full select-none"
                draggable={false}
              />
            ) : (
              <div className="aspect-[3/4]" />
            )}
            {pagePlacements.map((placement) => (
              <div
                key={placement.id}
                className="absolute cursor-move touch-none border border-brand bg-white/40 p-1"
                style={{
                  left: placement.left,
                  top: placement.top,
                  width: placement.width,
                  height: placement.height,
                }}
                onPointerDown={(event) => onSigPointerDown(event, placement)}
                onPointerMove={onSigPointerMove}
                onPointerUp={onSigPointerUp}
              >
                {signatureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={signatureUrl}
                    alt=""
                    className="h-full w-full object-contain"
                    draggable={false}
                  />
                ) : null}
                <button
                  type="button"
                  className="absolute -right-2 -top-2 rounded-full bg-brand px-1 text-xs text-brand-foreground"
                  aria-label="Remove signature"
                  onClick={() =>
                    setPlacements((current) =>
                      current.filter((item) => item.id !== placement.id),
                    )
                  }
                >
                  ×
                </button>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 h-4 w-4 translate-x-1/3 translate-y-1/3 cursor-se-resize touch-none rounded-sm border border-brand bg-panel"
                  aria-label="Resize signature"
                  onPointerDown={(event) =>
                    onResizePointerDown(event, placement)
                  }
                  onPointerMove={onSigPointerMove}
                  onPointerUp={onSigPointerUp}
                  onPointerCancel={onSigPointerUp}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() => void onExport()}
              disabled={pending}
            >
              {pending ? "Working…" : "Download signed PDF"}
            </Button>
            <Button onClick={reset} disabled={pending}>
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
