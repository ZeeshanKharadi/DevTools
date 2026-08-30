import type { ReactNode } from "react";
import type { ToolCapability } from "@/lib/tools/types";
import { cn } from "@/lib/cn";

type ToolWorkspaceProps = {
  label?: string;
  capabilities?: readonly ToolCapability[];
  children?: ReactNode;
  emptyMessage?: string;
  className?: string;
};

export function ToolWorkspace({
  label = "Workspace",
  capabilities,
  children,
  emptyMessage,
  className,
}: ToolWorkspaceProps) {
  return (
    <section
      aria-label={label}
      className={cn(
        "overflow-hidden rounded-xl border border-line bg-panel p-4 sm:p-6 lg:p-7",
        className,
      )}
    >
      {capabilities && capabilities.length > 0 ? (
        <p className="sr-only">Available actions: {capabilities.join(", ")}.</p>
      ) : null}
      {children ?? (
        <p className="text-sm text-muted">{emptyMessage}</p>
      )}
    </section>
  );
}
