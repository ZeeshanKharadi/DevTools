import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { getCategory, getRelatedTools } from "@/lib/tools/registry";
import type { Tool } from "@/lib/tools/types";
import type { ToolContent } from "@/content/tools/types";
import { Examples } from "./Examples";
import { HowToUse } from "./HowToUse";
import { PrivacyNotice } from "./PrivacyNotice";
import { RelatedTools } from "./RelatedTools";
import { ToolFAQ } from "./ToolFAQ";
import { ToolIsland } from "./ToolIsland";

type ToolPageProps = {
  tool: Tool;
  content: ToolContent;
};

export function ToolPage({ tool, content }: ToolPageProps) {
  const category = getCategory(tool.category);
  const related = getRelatedTools(tool);
  const privacy =
    content.privacy ??
    "Processed locally — nothing leaves your browser.";

  return (
    <div className="pb-16">
      <Container>
        <div className="pt-5">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Tools", path: "/tools" },
              { name: tool.name, path: `/tools/${tool.slug}` },
            ]}
          />
        </div>

        <header className="pt-20 sm:pt-24">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {category?.label ?? tool.category}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {tool.h1}
          </h1>
          <p className="mt-2 text-base text-muted">{tool.description}</p>
          <div className="mt-4">
            <PrivacyNotice>{privacy}</PrivacyNotice>
          </div>
        </header>

        <div className="mt-5">
          <ToolIsland tool={tool} />
        </div>

        <div className="mt-16 space-y-10">
          <HowToUse steps={content.howTo} />
          <Examples examples={content.examples} />
          <ToolFAQ faq={content.faq} />
          <RelatedTools tools={related} />
        </div>
      </Container>
    </div>
  );
}
