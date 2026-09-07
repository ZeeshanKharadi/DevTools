import Link from "next/link";
import { ParentBrandLine } from "@/components/legal/ParentBrandLine";
import { Container } from "@/components/layout/Container";
import type { LegalDocument } from "@/content/legal";
import { LEGAL_EFFECTIVE_LABEL, LEGAL_PAGES } from "@/lib/site";

type LegalPageProps = {
  document: LegalDocument;
};

export function LegalPage({ document }: LegalPageProps) {
  return (
    <Container className="py-10 sm:py-14">
      <article className="mx-auto max-w-3xl">
        <header className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Legal
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{document.h1}</h1>
          <p className="text-sm text-muted">
            Effective / last updated {LEGAL_EFFECTIVE_LABEL}.
          </p>
          <p className="text-base leading-7 text-muted">{document.intro}</p>
          <ParentBrandLine />
        </header>

        <div className="mt-12 space-y-10">
          {document.sections.map((section) => {
            const headingId = section.heading
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "");

            return (
              <section key={section.heading} aria-labelledby={headingId}>
                <h2
                  id={headingId}
                  className="text-xl font-semibold tracking-tight"
                >
                  {section.heading}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-3 text-sm leading-7 text-muted sm:text-base"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-muted sm:text-base">
                    {section.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </div>

        <nav
          aria-label="Other legal pages"
          className="mt-14 border-t border-line pt-6"
        >
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {LEGAL_PAGES.map((page) => {
              const current = page.path === document.path;

              return (
                <li key={page.path}>
                  {current ? (
                    <span className="text-foreground">{page.name}</span>
                  ) : (
                    <Link
                      href={page.path}
                      className="text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                    >
                      {page.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </article>
    </Container>
  );
}
