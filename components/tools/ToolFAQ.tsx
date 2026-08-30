import { JsonLd } from "@/components/ui/JsonLd";
import type { FaqItem } from "@/content/tools/types";
import { faqJsonLd } from "@/lib/seo";

type ToolFAQProps = {
  faq: readonly FaqItem[];
};

export function ToolFAQ({ faq }: ToolFAQProps) {
  if (faq.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="tool-faq-heading" className="space-y-4">
      <JsonLd data={faqJsonLd(faq)} />
      <h2 id="tool-faq-heading" className="text-xl font-semibold tracking-tight">
        Frequently asked questions
      </h2>
      <dl className="space-y-4">
        {faq.map((item) => (
          <div
            key={item.question}
            className="rounded-xl border border-line bg-panel p-5"
          >
            <dt className="text-sm font-semibold text-foreground">
              {item.question}
            </dt>
            <dd className="mt-2 text-sm text-muted">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
