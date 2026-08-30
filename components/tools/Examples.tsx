import type { ToolExample } from "@/content/tools/types";

type ExamplesProps = {
  examples: readonly ToolExample[];
};

export function Examples({ examples }: ExamplesProps) {
  return (
    <section aria-labelledby="examples-heading" className="space-y-4">
      <h2 id="examples-heading" className="text-xl font-semibold tracking-tight">
        Examples
      </h2>
      <ul className="space-y-4">
        {examples.map((example) => (
          <li
            key={example.title}
            className="rounded-xl border border-line bg-panel p-5"
          >
            <h3 className="text-sm font-semibold text-foreground">
              {example.title}
            </h3>
            <p className="mt-2 text-sm text-muted">{example.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
