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
  compressImage,
  downloadBlob,
  formatBytes,
  loadImageFile,
  mimeFromFile,
  percentSaved,
  releaseLoadedImage,
  runWithConcurrency,
  type ImageOutputFormat,
  type LoadedImage,
} from "@/lib/tools/image-shared";

type ResultRow = {
  id: string;
  name: string;
  originalSize: number;
  resultSize: number;
  width: number;
  height: number;
  mime: ImageOutputFormat;
  blob: Blob;
  filename: string;
  status: "done" | "error" | "pending";
  message?: string;
};

export default function ImageCompressorTool() {
  const [images, setImages] = useState<LoadedImage[]>([]);
  const [quality, setQuality] = useState(0.75);
  const [format, setFormat] = useState<ImageOutputFormat | "original">("original");
  const [maxWidth, setMaxWidth] = useState<string>("");
  const [maxHeight, setMaxHeight] = useState<string>("");
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
    setStatus(null);
    const next = [...images];
    for (const file of files) {
      if (next.length >= MAX_BATCH_IMAGES) {
        setError(`You can compress up to ${MAX_BATCH_IMAGES} images at once.`);
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

  function removeImage(id: string) {
    setImages((current) => {
      const target = current.find((item) => item.id === id);
      if (target) releaseLoadedImage(target);
      return current.filter((item) => item.id !== id);
    });
    setResults((current) => current.filter((item) => item.id !== id));
  }

  async function onCompress() {
    if (images.length === 0) {
      setError("Add at least one image.");
      return;
    }
    setPending(true);
    setError(null);
    setStatus("Compressing images…");
    const rows: ResultRow[] = images.map((image) => ({
      id: image.id,
      name: image.name,
      originalSize: image.size,
      resultSize: 0,
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
        const outputFormat =
          format === "original"
            ? ((mimeFromFile(image.file) ?? "image/jpeg") as ImageOutputFormat)
            : format;
        if (outputFormat === "image/png") {
          // Honest PNG path: dimension reduction only; no fake JPEG-style quality.
        }
        const result = await compressImage(image, {
          format: outputFormat,
          quality: outputFormat === "image/png" ? 1 : quality,
          maxWidth: maxWidth ? Number(maxWidth) : null,
          maxHeight: maxHeight ? Number(maxHeight) : null,
          background: "#ffffff",
        });
        rows[index] = {
          id: image.id,
          name: image.name,
          originalSize: image.size,
          resultSize: result.blob.size,
          width: result.width,
          height: result.height,
          mime: result.mime,
          blob: result.blob,
          filename: result.filename,
          status: "done",
          message:
            result.blob.size >= image.size
              ? "Result is not smaller than the original."
              : undefined,
        };
      } catch (caught) {
        rows[index] = {
          ...rows[index]!,
          status: "error",
          message:
            caught instanceof ImageToolError
              ? caught.message
              : "Compression failed.",
        };
      }
      setResults([...rows]);
    });

    setPending(false);
    setStatus("Compression finished.");
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
        const parts = row.filename.split(".");
        const ext = parts.pop();
        name = `${parts.join(".")}-${counter}.${ext}`;
        counter += 1;
      }
      used.add(name);
      zip.file(name, row.blob);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, "infyratools-compressed-images.zip");
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
        label="Drop JPG, PNG, or WebP images to compress"
        hint="Processing stays in your browser. PNG savings mainly come from resizing."
        disabled={pending}
        onFiles={(files) => void addFiles(files)}
      />

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Output format</span>
          <select
            className="w-full rounded-md border border-line bg-panel px-3 py-2"
            value={format}
            onChange={(e) => setFormat(e.target.value as typeof format)}
          >
            <option value="original">Same as original</option>
            <option value="image/jpeg">JPEG</option>
            <option value="image/webp">WebP</option>
            <option value="image/png">PNG</option>
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">
            Quality {format === "image/png" ? "(N/A for PNG)" : ""}
          </span>
          <Input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={quality}
            disabled={format === "image/png"}
            onChange={(e) => setQuality(Number(e.target.value))}
          />
          <span className="text-xs text-muted">{Math.round(quality * 100)}%</span>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Max width (px)</span>
          <Input
            type="number"
            min={1}
            placeholder="Optional"
            value={maxWidth}
            onChange={(e) => setMaxWidth(e.target.value)}
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Max height (px)</span>
          <Input
            type="number"
            min={1}
            placeholder="Optional"
            value={maxHeight}
            onChange={(e) => setMaxHeight(e.target.value)}
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
                onClick={() => removeImage(image.id)}
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
          onClick={() => void onCompress()}
          disabled={pending || images.length === 0}
        >
          {pending ? "Compressing…" : "Compress"}
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
        <ul className="min-w-0 space-y-2">
          {results.map((row) => (
            <li
              key={row.id}
              className="min-w-0 rounded-md border border-line p-3 text-sm"
            >
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="truncate font-medium" title={row.name}>
                    {row.name}
                  </p>
                  {row.status === "done" ? (
                    <p className="text-xs text-muted">
                      {formatBytes(row.originalSize)} →{" "}
                      {formatBytes(row.resultSize)} (
                      {percentSaved(row.originalSize, row.resultSize).toFixed(1)}
                      %) · {row.width}×{row.height} · {row.mime}
                    </p>
                  ) : (
                    <p className="text-xs text-muted">{row.status}</p>
                  )}
                  {row.message ? (
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      {row.message}
                    </p>
                  ) : null}
                </div>
                {row.status === "done" ? (
                  <Button
                    onClick={() => downloadBlob(row.blob, row.filename)}
                  >
                    Download
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {format === "image/png" ? (
        <p className="text-xs text-muted">
          PNG export is lossless in the browser canvas API. Size reductions mainly
          come from lowering dimensions; a JPEG-style quality slider does not apply.
        </p>
      ) : null}

      <PdfProcessingStatus message={error} tone="error" />
      <PdfProcessingStatus message={status} tone="success" />
    </div>
  );
}
