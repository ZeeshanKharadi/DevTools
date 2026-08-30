import { ToolCard } from "./ToolCard";
import type { Tool } from "@/lib/tools/types";

type RelatedToolsProps = {
  tools: readonly Tool[];
};

export function RelatedTools({ tools }: RelatedToolsProps) {
  if (tools.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="related-heading" className="space-y-4">
      <h2 id="related-heading" className="text-xl font-semibold tracking-tight">
        Related tools
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <li key={tool.slug}>
            <ToolCard tool={tool} />
          </li>
        ))}
      </ul>
    </section>
  );
}
