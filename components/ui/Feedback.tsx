import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type FeedbackTone = "error" | "success" | "empty";

type FeedbackProps = {
  id?: string;
  tone?: FeedbackTone;
  children: ReactNode;
  live?: boolean;
};

const toneClass: Record<FeedbackTone, string> = {
  error: "border-danger/40 bg-danger-soft text-danger",
  success: "border-brand/30 bg-brand-soft text-brand",
  empty: "border-line bg-canvas text-muted",
};

export function Feedback({
  id,
  tone = "empty",
  children,
  live = false,
}: FeedbackProps) {
  return (
    <div
      id={id}
      role={tone === "error" ? "alert" : undefined}
      aria-live={live ? "polite" : undefined}
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        toneClass[tone],
      )}
    >
      {children}
    </div>
  );
}
