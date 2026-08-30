import type { HowToStep } from "@/content/tools/types";

type HowToUseProps = {
  steps: readonly HowToStep[];
};

export function HowToUse({ steps }: HowToUseProps) {
  return (
    <section aria-labelledby="how-to-heading" className="space-y-4">
      <h2 id="how-to-heading" className="text-xl font-semibold tracking-tight">
        How to use
      </h2>
      <ol className="space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className="rounded-xl border border-line bg-panel p-5">
            <h3 className="text-sm font-semibold text-foreground">
              {index + 1}. {step.title}
            </h3>
            <p className="mt-2 text-sm text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
