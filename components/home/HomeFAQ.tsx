import { JsonLd } from "@/components/ui/JsonLd";
import { homeFaq } from "@/content/home-faq";
import { faqJsonLd } from "@/lib/seo";

export function HomeFAQ() {
  return (
    <section aria-labelledby="faq-heading" className="space-y-4">
      <JsonLd data={faqJsonLd(homeFaq)} />
      <h2 id="faq-heading" className="text-xl font-semibold tracking-tight">
        Frequently asked questions
      </h2>
      <dl className="space-y-4">
        {homeFaq.map((item) => (
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
