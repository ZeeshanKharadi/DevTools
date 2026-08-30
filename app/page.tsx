import { CategoryList } from "@/components/home/CategoryList";
import { Hero } from "@/components/home/Hero";
import { HomeFAQ } from "@/components/home/HomeFAQ";
import { PlatformIntro } from "@/components/home/PlatformIntro";
import { ToolGrid } from "@/components/home/ToolGrid";
import { Container } from "@/components/layout/Container";
import { siteMetadata } from "@/lib/seo";
import {
  CATEGORIES,
  getAllTools,
  getPopularTools,
} from "@/lib/tools/registry";

export const metadata = siteMetadata({
  title: "Free Online Developer Tools",
  description:
    "Fast, simple and privacy-friendly tools for developers. JSON, JWT, Base64, UUID, regex, and more — processed in your browser.",
  path: "/",
});

export default function HomePage() {
  const tools = getAllTools();
  const popular = getPopularTools();

  return (
    <Container className="space-y-14 pb-16">
      <Hero tools={tools} />
      <ToolGrid tools={popular} title="Popular tools" id="popular-heading" />
      <CategoryList categories={CATEGORIES} tools={tools} />
      <ToolGrid tools={tools} title="All tools" id="all-tools-heading" />
      <PlatformIntro />
      <HomeFAQ />
    </Container>
  );
}
