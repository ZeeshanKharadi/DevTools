import type { HowToStep } from "@/content/tools/types";

type HowToUseProps = {
  steps: readonly HowToStep[];
  heading?: string;
  headingId?: string;
};

export function HowToUse({
  steps,
  heading = "How to use",
  headingId = "how-to-heading",
}: HowToUseProps) {
  if (steps.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={headingId} className="space-y-4">
      <h2 id={headingId} className="text-xl font-semibold tracking-tight">
        {heading}
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
