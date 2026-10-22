"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PdfFileDropzone } from "@/components/pdf/PdfFileDropzone";
import { PdfFileList } from "@/components/pdf/PdfFileList";
import { PdfProcessingStatus } from "@/components/pdf/PdfProcessingStatus";
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGE_FILES,
  PdfToolError,
  bytesToPdfBlob,
  downloadBlob,
  imagesToPdf,
  isImageMime,
  revokeObjectUrl,
  type MarginOption,
  type OrientationOption,
  type PageSizeOption,
} from "@/lib/tools/pdf-shared";

type ImageItem = {
  id: string;
  file: File;
  name: string;
  size: number;
  mime: string;
  bytes: ArrayBuffer;
  previewUrl: string;
};

function createId(): string {
  return `img-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function JpgToPdfTool() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeOption>("fit");
  const [orientation, setOrientation] = useState<OrientationOption>("portrait");
  const [margin, setMargin] = useState<MarginOption>("small");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    return () => {
      images.forEach((image) => revokeObjectUrl(image.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addFiles(incoming: File[]) {
    setError(null);
    setStatus(null);
    const next = [...images];
    for (const file of incoming) {
      if (next.length >= MAX_IMAGE_FILES) {
        setError(`You can convert up to ${MAX_IMAGE_FILES} images at once.`);
        break;
      }
      if (!isImageMime(file)) {
        setError(`"${file.name}" is not a JPG or PNG image.`);
        continue;
      }
      if (file.size === 0) {
        setError(`"${file.name}" is empty.`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setError(`"${file.name}" is larger than 20 MB.`);
        continue;
      }
      try {
        const bytes = await file.arrayBuffer();
        next.push({
          id: createId(),
          file,
          name: file.name,
          size: file.size,
          mime: file.type || (file.name.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg"),
          bytes,
          previewUrl: URL.createObjectURL(file),
        });
      } catch {
        setError(`Could not read "${file.name}".`);
      }
    }
    setImages(next);
  }

  function move(id: string, direction: -1 | 1) {
    setImages((current) => {
      const index = current.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) {
        return current;
      }
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  }

  function remove(id: string) {
    setImages((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        revokeObjectUrl(target.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  }

  async function onConvert() {
    setPending(true);
    setError(null);
    setStatus("Creating PDF…");
    try {
      const bytes = await imagesToPdf(
        images.map((image) => ({
          bytes: image.bytes,
          mime: image.mime,
          name: image.name,
        })),
        { pageSize, orientation, margin },
      );
      downloadBlob(bytesToPdfBlob(bytes), "infyratools-images.pdf");
      setStatus(`Created a PDF with ${images.length} page${images.length === 1 ? "" : "s"}.`);
    } catch (caught) {
      setStatus(null);
      setError(
        caught instanceof PdfToolError
          ? caught.message
          : "Could not convert these images.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-line bg-panel p-4">
      <PdfFileDropzone
        accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
        multiple
        label="Drop JPG or PNG images"
        hint="One image becomes one PDF page. Order in the list is the page order."
        disabled={pending}
        onFiles={(files) => void addFiles(files)}
      />
      <PdfFileList
        items={images.map((image) => ({
          id: image.id,
          name: image.name,
          size: image.size,
          previewUrl: image.previewUrl,
        }))}
        onRemove={remove}
        onMoveUp={(id) => move(id, -1)}
        onMoveDown={(id) => move(id, 1)}
        emptyLabel="No images selected yet."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="font-medium">Page size</span>
          <select
            className="w-full rounded-md border border-line bg-canvas px-3 py-2"
            value={pageSize}
            onChange={(event) => setPageSize(event.target.value as PageSizeOption)}
          >
            <option value="fit">Fit to image</option>
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Orientation</span>
          <select
            className="w-full rounded-md border border-line bg-canvas px-3 py-2"
            value={orientation}
            disabled={pageSize === "fit"}
            onChange={(event) =>
              setOrientation(event.target.value as OrientationOption)
            }
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">Margins</span>
          <select
            className="w-full rounded-md border border-line bg-canvas px-3 py-2"
            value={margin}
            onChange={(event) => setMargin(event.target.value as MarginOption)}
          >
            <option value="none">None</option>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          disabled={pending || images.length === 0}
          onClick={() => void onConvert()}
        >
          {pending ? "Creating…" : "Create PDF"}
        </Button>
        <Button
          disabled={pending || images.length === 0}
          onClick={() => {
            images.forEach((image) => revokeObjectUrl(image.previewUrl));
            setImages([]);
            setError(null);
            setStatus(null);
          }}
        >
          Reset
        </Button>
      </div>
      <PdfProcessingStatus message={error} tone="error" />
      <PdfProcessingStatus
        message={status}
        tone={status?.startsWith("Created") ? "success" : "empty"}
      />
    </div>
  );
}
