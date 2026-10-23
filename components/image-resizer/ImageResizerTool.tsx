"use client";

import { useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImageFileDropzone } from "@/components/image/ImageFileDropzone";
import { PdfProcessingStatus } from "@/components/pdf/PdfProcessingStatus";
import {
  ImageToolError,
  MAX_BATCH_IMAGES,
  computeAspectSize,
  downloadBlob,
  formatBytes,
  loadImageFile,
  mimeFromFile,
  releaseLoadedImage,
  resizeImage,
  runWithConcurrency,
  sizeFromPercent,
  type FitMode,
  type ImageOutputFormat,
  type LoadedImage,
} from "@/lib/tools/image-shared";

type ResultRow = {
  id: string;
  name: string;
  width: number;
  height: number;
  mime: ImageOutputFormat;
  blob: Blob;
  filename: string;
  status: "done" | "error" | "pending";
  message?: string;
};

const PRESETS = [
  { label: "1920 × 1080", width: 1920, height: 1080 },
  { label: "1280 × 720", width: 1280, height: 720 },
  { label: "1080 × 1080", width: 1080, height: 1080 },
  { label: "800 × 600", width: 800, height: 600 },
] as const;

export default function ImageResizerTool() {
  const [images, setImages] = useState<LoadedImage[]>([]);
  const [width, setWidth] = useState("800");
  const [height, setHeight] = useState("600");
  const [lockAspect, setLockAspect] = useState(true);
  const [percent, setPercent] = useState("100");
  const [mode, setMode] = useState<"pixels" | "percent">("pixels");
  const [fit, setFit] = useState<FitMode>("contain");
  const [format, setFormat] = useState<ImageOutputFormat | "original">("original");
  const [quality, setQuality] = useState(0.92);
  const [background, setBackground] = useState("#ffffff");
  const [results, setResults] = useState<ResultRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(() => {
    return () => {
      // Unmount only — per-image release happens in remove/reset.
      imagesRef.current.forEach(releaseLoadedImage);
    };
  }, []);

  async function addFiles(files: File[]) {
    setError(null);
    const next = [...images];
    for (const file of files) {
      if (next.length >= MAX_BATCH_IMAGES) {
        setError(`You can resize up to ${MAX_BATCH_IMAGES} images at once.`);
        break;
      }
      try {
        next.push(await loadImageFile(file));
      } catch (caught) {
        setError(
          caught instanceof ImageToolError
            ? caught.message
            : `Could not read "${file.name}".`,
        );
      }
    }
    setImages(next);
    setResults([]);
  }

  function onWidthChange(value: string) {
    setWidth(value);
    if (!lockAspect || images.length === 0) return;
    const source = images[0]!;
    const nextWidth = Number(value);
    if (!Number.isFinite(nextWidth) || nextWidth <= 0) return;
    const sized = computeAspectSize(
      source.width,
      source.height,
      nextWidth,
      null,
      true,
    );
    setHeight(String(sized.height));
  }

  function onHeightChange(value: string) {
    setHeight(value);
    if (!lockAspect || images.length === 0) return;
    const source = images[0]!;
    const nextHeight = Number(value);
    if (!Number.isFinite(nextHeight) || nextHeight <= 0) return;
    const sized = computeAspectSize(
      source.width,
      source.height,
      null,
      nextHeight,
      true,
    );
    setWidth(String(sized.width));
  }

  async function onResize() {
    if (images.length === 0) {
      setError("Add at least one image.");
      return;
    }
    setPending(true);
    setError(null);
    setStatus("Resizing images…");
    const rows: ResultRow[] = images.map((image) => ({
      id: image.id,
      name: image.name,
      width: image.width,
      height: image.height,
      mime: (mimeFromFile(image.file) ?? "image/jpeg") as ImageOutputFormat,
      blob: new Blob(),
      filename: image.name,
      status: "pending",
    }));
    setResults(rows);

    await runWithConcurrency(images, 2, async (image, index) => {
      try {
        const target =
          mode === "percent"
            ? sizeFromPercent(
                image.width,
                image.height,
                Math.min(400, Math.max(1, Number(percent) || 100)),
              )
            : lockAspect
              ? computeAspectSize(
                  image.width,
                  image.height,
                  Number(width) || image.width,
                  Number(height) || image.height,
                  true,
                )
              : {
                  width: Math.max(1, Math.round(Number(width) || image.width)),
                  height: Math.max(1, Math.round(Number(height) || image.height)),
                };

        const outputFormat =
          format === "original"
            ? ((mimeFromFile(image.file) ?? "image/jpeg") as ImageOutputFormat)
            : format;

        const result = await resizeImage(image, {
          width: target.width,
          height: mode === "percent" || lockAspect ? target.height : Math.max(1, Math.round(Number(height) || target.height)),
          fit: mode === "percent" || lockAspect ? "stretch" : fit,
          format: outputFormat,
          quality: outputFormat === "image/png" ? 1 : quality,
          background,
        });

        // When unlocked exact dimensions with contain/cover, use requested box size
        const finalWidth =
          mode === "pixels" && !lockAspect
            ? Math.max(1, Math.round(Number(width) || image.width))
            : result.width;
        const finalHeight =
          mode === "pixels" && !lockAspect
            ? Math.max(1, Math.round(Number(height) || image.height))
            : result.height;

        const fitted =
          mode === "pixels" && !lockAspect
            ? await resizeImage(image, {
                width: finalWidth,
                height: finalHeight,
                fit,
                format: outputFormat,
                quality: outputFormat === "image/png" ? 1 : quality,
                background,
              })
            : result;

        rows[index] = {
          id: image.id,
          name: image.name,
          width: fitted.width,
          height: fitted.height,
          mime: fitted.mime,
          blob: fitted.blob,
          filename: fitted.filename,
          status: "done",
        };
      } catch (caught) {
        rows[index] = {
          ...rows[index]!,
          status: "error",
          message:
            caught instanceof ImageToolError
              ? caught.message
              : "Resize failed.",
        };
      }
      setResults([...rows]);
    });

    setPending(false);
    setStatus("Resize finished.");
  }

  async function downloadZip() {
    const done = results.filter((row) => row.status === "done");
    if (done.length === 0) return;
    const zip = new JSZip();
    const used = new Set<string>();
    for (const row of done) {
      let name = row.filename;
      let counter = 1;
      while (used.has(name)) {
        name = row.filename.replace(/(\.\w+)$/, `-${counter}$1`);
        counter += 1;
      }
      used.add(name);
      zip.file(name, row.blob);
    }
    downloadBlob(
      await zip.generateAsync({ type: "blob" }),
      "infyratools-resized-images.zip",
    );
  }

  function reset() {
    images.forEach(releaseLoadedImage);
    setImages([]);
    setResults([]);
    setError(null);
    setStatus(null);
  }

  return (
    <div className="min-w-0 max-w-full space-y-4 rounded-xl border border-line bg-panel p-4">
      <ImageFileDropzone
        label="Drop JPG, PNG, or WebP images to resize"
        hint="Choose exact pixels, percentages, or presets. Processing stays in your browser."
        disabled={pending}
        onFiles={(files) => void addFiles(files)}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          variant={mode === "pixels" ? "primary" : "secondary"}
          onClick={() => setMode("pixels")}
        >
          Exact pixels
        </Button>
        <Button
          variant={mode === "percent" ? "primary" : "secondary"}
          onClick={() => setMode("percent")}
        >
          Percentage
        </Button>
      </div>

      {mode === "pixels" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Width</span>
            <Input
              type="number"
              min={1}
              value={width}
              onChange={(e) => onWidthChange(e.target.value)}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Height</span>
            <Input
              type="number"
              min={1}
              value={height}
              onChange={(e) => onHeightChange(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={lockAspect}
              onChange={(e) => setLockAspect(e.target.checked)}
            />
            Lock aspect ratio
          </label>
          {!lockAspect ? (
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Fit</span>
              <select
                className="w-full rounded-md border border-line bg-panel px-3 py-2"
                value={fit}
                onChange={(e) => setFit(e.target.value as FitMode)}
              >
                <option value="contain">Contain (pad)</option>
                <option value="cover">Cover (crop)</option>
                <option value="stretch">Stretch</option>
              </select>
            </label>
          ) : null}
        </div>
      ) : (
        <label className="block max-w-xs space-y-1 text-sm">
          <span className="font-medium">Scale percent</span>
          <Input
            type="number"
            min={1}
            max={400}
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
          />
        </label>
      )}

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            onClick={() => {
              setMode("pixels");
              setLockAspect(false);
              setFit("contain");
              setWidth(String(preset.width));
              setHeight(String(preset.height));
            }}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Output format</span>
          <select
            className="w-full rounded-md border border-line bg-panel px-3 py-2"
            value={format}
            onChange={(e) => setFormat(e.target.value as typeof format)}
          >
            <option value="original">Same as original</option>
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
            <option value="image/webp">WebP</option>
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Quality</span>
          <Input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={quality}
            disabled={format === "image/png"}
            onChange={(e) => setQuality(Number(e.target.value))}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Background (contain/JPEG)</span>
          <Input
            type="color"
            value={background}
            onChange={(e) => setBackground(e.target.value)}
          />
        </label>
      </div>

      {images.length > 0 ? (
        <ul className="min-w-0 space-y-2">
          {images.map((image) => (
            <li
              key={image.id}
              className="flex min-w-0 items-center gap-3 rounded-md border border-line p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.objectUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded object-cover"
              />
              <div className="min-w-0 flex-1 overflow-hidden text-sm">
                <p className="truncate font-medium" title={image.name}>
                  {image.name}
                </p>
                <p className="truncate text-xs text-muted">
                  {image.width}×{image.height} · {formatBytes(image.size)}
                </p>
              </div>
              <Button
                className="shrink-0"
                onClick={() => {
                  releaseLoadedImage(image);
                  setImages((current) =>
                    current.filter((item) => item.id !== image.id),
                  );
                }}
                disabled={pending}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No images selected yet.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={() => void onResize()}
          disabled={pending || images.length === 0}
        >
          {pending ? "Resizing…" : "Resize"}
        </Button>
        <Button
          onClick={() => void downloadZip()}
          disabled={pending || !results.some((row) => row.status === "done")}
        >
          Download ZIP
        </Button>
        <Button onClick={reset} disabled={pending}>
          Reset
        </Button>
      </div>

      {results.length > 0 ? (
        <ul className="space-y-2">
          {results.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line p-3 text-sm"
            >
              <div>
                <p className="font-medium">{row.name}</p>
                {row.status === "done" ? (
                  <p className="text-xs text-muted">
                    {row.width}×{row.height} · {row.mime} ·{" "}
                    {formatBytes(row.blob.size)}
                  </p>
                ) : (
                  <p className="text-xs text-muted">
                    {row.message ?? row.status}
                  </p>
                )}
              </div>
              {row.status === "done" ? (
                <Button onClick={() => downloadBlob(row.blob, row.filename)}>
                  Download
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <PdfProcessingStatus message={error} tone="error" />
      <PdfProcessingStatus message={status} tone="success" />
    </div>
  );
}
