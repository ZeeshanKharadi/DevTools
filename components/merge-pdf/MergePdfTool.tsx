"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PdfFileDropzone } from "@/components/pdf/PdfFileDropzone";
import { PdfFileList } from "@/components/pdf/PdfFileList";
import { PdfProcessingStatus } from "@/components/pdf/PdfProcessingStatus";
import {
  MAX_MERGE_FILES,
  PdfToolError,
  bytesToPdfBlob,
  downloadBlob,
  mergePdfs,
  readPdfFile,
  type LoadedPdf,
} from "@/lib/tools/pdf-shared";

export default function MergePdfTool() {
  const [files, setFiles] = useState<LoadedPdf[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    return () => {
      // no object URLs retained for merge list
    };
  }, []);

  async function addFiles(incoming: File[]) {
    setError(null);
    setStatus(null);
    const next = [...files];
    for (const file of incoming) {
      if (next.length >= MAX_MERGE_FILES) {
        setError(`You can merge up to ${MAX_MERGE_FILES} PDFs at once.`);
        break;
      }
      try {
        next.push(await readPdfFile(file));
      } catch (caught) {
        setError(
          caught instanceof PdfToolError
            ? caught.message
            : `Could not read "${file.name}".`,
        );
      }
    }
    setFiles(next);
  }

  function move(id: string, direction: -1 | 1) {
    setFiles((current) => {
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

  async function onMerge() {
    setPending(true);
    setError(null);
    setStatus("Merging PDFs…");
    try {
      const bytes = await mergePdfs(files);
      downloadBlob(bytesToPdfBlob(bytes), "infyratools-merged.pdf");
      setStatus(
        `Merged ${files.length} PDFs into one download (${files.reduce((sum, file) => sum + file.pageCount, 0)} pages).`,
      );
    } catch (caught) {
      setStatus(null);
      setError(
        caught instanceof PdfToolError
          ? caught.message
          : "Could not merge these PDFs.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-line bg-panel p-4">
      <PdfFileDropzone
        accept="application/pdf,.pdf"
        multiple
        label="Drop PDFs here to merge"
        hint="Order in the list is the merge order. Processing stays in your browser."
        disabled={pending}
        onFiles={(selected) => void addFiles(selected)}
      />
      <PdfFileList
        items={files.map((file) => ({
          id: file.id,
          name: file.name,
          size: file.size,
          pageCount: file.pageCount,
        }))}
        onRemove={(id) => setFiles((current) => current.filter((file) => file.id !== id))}
        onMoveUp={(id) => move(id, -1)}
        onMoveDown={(id) => move(id, 1)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          disabled={pending || files.length < 2}
          onClick={() => void onMerge()}
        >
          {pending ? "Merging…" : "Merge PDF"}
        </Button>
        <Button
          disabled={pending || files.length === 0}
          onClick={() => {
            setFiles([]);
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
        tone={status?.startsWith("Merged") ? "success" : "empty"}
      />
    </div>
  );
}
