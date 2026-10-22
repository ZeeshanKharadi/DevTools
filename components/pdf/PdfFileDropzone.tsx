"use client";

import { useRef, type ChangeEvent, type DragEvent } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type PdfFileDropzoneProps = {
  accept: string;
  multiple?: boolean;
  label: string;
  hint?: string;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
};

export function PdfFileDropzone({
  accept,
  multiple = false,
  label,
  hint,
  disabled = false,
  onFiles,
}: PdfFileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function takeFiles(list: FileList | null) {
    if (!list || list.length === 0) {
      return;
    }
    onFiles(Array.from(list));
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (disabled) {
      return;
    }
    takeFiles(event.dataTransfer.files);
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    takeFiles(event.target.files);
  }

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      className={cn(
        "rounded-xl border border-dashed border-line bg-panel px-4 py-8 text-center",
        disabled && "opacity-60",
      )}
    >
      <p className="text-sm font-medium text-foreground">{label}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      <div className="mt-4">
        <Button
          variant="primary"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Browse files
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          onChange={onChange}
        />
      </div>
    </div>
  );
}
