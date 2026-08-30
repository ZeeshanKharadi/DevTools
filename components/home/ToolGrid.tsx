import { ToolCard } from "@/components/tools/ToolCard";
import type { Tool } from "@/lib/tools/types";

type ToolGridProps = {
  tools: readonly Tool[];
  title?: string;
  id?: string;
};

export function ToolGrid({ tools, title, id }: ToolGridProps) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      {title ? (
        <h2 id={id} className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
      ) : null}
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
