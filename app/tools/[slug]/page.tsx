import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getToolContent } from "@/content/tools";
import { ToolPage } from "@/components/tools/ToolPage";
import { toolMetadata } from "@/lib/seo";
import { getAllTools, getToolBySlug } from "@/lib/tools/registry";

type ToolRouteProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllTools().map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: ToolRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return {};
  }

  return toolMetadata(tool);
}

export default async function ToolRoutePage({ params }: ToolRouteProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  return <ToolPage tool={tool} content={getToolContent(tool.slug)} />;
}
