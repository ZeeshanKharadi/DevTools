"use client";

import { Button } from "./Button";

type DownloadButtonProps = {
  value: string;
  filename: string;
  mimeType?: string;
  label?: string;
};

export function DownloadButton({
  value,
  filename,
  mimeType = "text/plain;charset=utf-8",
  label = "Download",
}: DownloadButtonProps) {
  function handleDownload() {
    const blob = new Blob([value], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button onClick={handleDownload} disabled={!value}>
      {label}
    </Button>
  );
}
