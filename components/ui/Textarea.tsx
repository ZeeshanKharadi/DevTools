import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type TextareaSurface = "default" | "input" | "output";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  surface?: TextareaSurface;
};

const surfaceClass: Record<TextareaSurface, string> = {
  default: "bg-canvas",
  input: "bg-editor",
  output: "bg-editor-alt",
};

export function Textarea({
  className,
  surface = "default",
  ...props
}: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-40 w-full min-w-0 resize-y rounded-lg border border-line px-4 py-3 font-mono text-[13px] leading-6 text-foreground shadow-sm [tab-size:2] placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger sm:text-sm sm:leading-7",
        surfaceClass[surface],
        className,
      )}
      {...props}
    />
  );
}
