"use client";

import { Button } from "@/components/ui/Button";
import { formatBytes } from "@/lib/tools/pdf-shared";

export type PdfListItem = {
  id: string;
  name: string;
  size: number;
  pageCount?: number;
  previewUrl?: string | null;
};

type PdfFileListProps = {
  items: PdfListItem[];
  onRemove: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  emptyLabel?: string;
};

export function PdfFileList({
  items,
  onRemove,
  onMoveUp,
  onMoveDown,
  emptyLabel = "No files selected yet.",
}: PdfFileListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-panel px-3 py-2"
        >
          {item.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.previewUrl}
              alt=""
              className="h-12 w-10 rounded object-cover"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.name}</p>
            <p className="text-xs text-muted">
              {formatBytes(item.size)}
              {typeof item.pageCount === "number"
                ? ` · ${item.pageCount} page${item.pageCount === 1 ? "" : "s"}`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {onMoveUp ? (
              <Button
                variant="ghost"
                aria-label={`Move ${item.name} up`}
                disabled={index === 0}
                onClick={() => onMoveUp(item.id)}
              >
                Up
              </Button>
            ) : null}
            {onMoveDown ? (
              <Button
                variant="ghost"
                aria-label={`Move ${item.name} down`}
                disabled={index === items.length - 1}
                onClick={() => onMoveDown(item.id)}
              >
                Down
              </Button>
            ) : null}
            <Button
              variant="ghost"
              aria-label={`Remove ${item.name}`}
              onClick={() => onRemove(item.id)}
            >
              Remove
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
