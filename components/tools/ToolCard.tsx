import Link from "next/link";
import { getCategory } from "@/lib/tools/registry";
import type { Tool } from "@/lib/tools/types";

type ToolCardProps = {
  tool: Tool;
};

export function ToolCard({ tool }: ToolCardProps) {
  const category = getCategory(tool.category);

  return (
    <article className="flex h-full flex-col rounded-xl border border-line bg-panel p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {category?.label ?? tool.category}
      </p>
      <h3 className="mt-2 text-base font-semibold text-foreground">
        <Link
          href={`/tools/${tool.slug}`}
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          {tool.name}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-sm text-muted">{tool.description}</p>
      <p className="mt-4 text-sm font-medium text-brand">
        <Link
          href={`/tools/${tool.slug}`}
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          Open tool
        </Link>
      </p>
    </article>
  );
}
