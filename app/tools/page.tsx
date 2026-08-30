import { CategoryList } from "@/components/home/CategoryList";
import { ToolGrid } from "@/components/home/ToolGrid";
import { Container } from "@/components/layout/Container";
import { siteMetadata } from "@/lib/seo";
import {
  CATEGORIES,
  getAllTools,
  getToolsByCategory,
} from "@/lib/tools/registry";

export const metadata = siteMetadata({
  title: "All Developer Tools",
  description:
    "Browse every free, browser-based developer tool. Filter by category or open a tool directly.",
  path: "/tools",
});

export default function ToolsPage() {
  const tools = getAllTools();

  return (
    <Container className="space-y-12 py-10">
      <header className="max-w-2xl space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Developer tools</h1>
        <p className="text-base text-muted">
          Every V1 tool runs in your browser. Open a category or jump straight
          to a workspace.
        </p>
      </header>

      <CategoryList categories={CATEGORIES} tools={tools} />

      {CATEGORIES.map((category) => (
        <div key={category.id} id={category.id} className="scroll-mt-24">
          <ToolGrid
            tools={getToolsByCategory(category.id)}
            title={category.label}
            id={`${category.id}-heading`}
          />
        </div>
      ))}
    </Container>
  );
}
