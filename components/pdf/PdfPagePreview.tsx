"use client";

import { cn } from "@/lib/cn";

type PdfPagePreviewProps = {
  pageNumber: number;
  src?: string | null;
  selected?: boolean;
  rotation?: number;
  onToggle?: () => void;
  badge?: string;
  children?: React.ReactNode;
};

export function PdfPagePreview({
  pageNumber,
  src,
  selected = false,
  rotation = 0,
  onToggle,
  badge,
  children,
}: PdfPagePreviewProps) {
  const content = (
    <>
      <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-md bg-canvas">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={`Page ${pageNumber}`}
            className="max-h-full max-w-full object-contain"
            style={{ transform: rotation ? `rotate(${rotation}deg)` : undefined }}
          />
        ) : (
          <span className="text-xs text-muted">Page {pageNumber}</span>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium">Page {pageNumber}</span>
        {badge ? <span className="text-[10px] text-muted">{badge}</span> : null}
      </div>
      {children}
    </>
  );

  if (onToggle) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "rounded-lg border p-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
          selected
            ? "border-brand bg-brand-soft"
            : "border-line bg-panel hover:bg-panel-hover",
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-panel p-2">{content}</div>
  );
}
