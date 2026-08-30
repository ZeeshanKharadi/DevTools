import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { getAllTools } from "@/lib/tools/registry";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["/", "/tools"].map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date(),
  }));

  const toolRoutes = getAllTools().map((tool) => ({
    url: absoluteUrl(`/tools/${tool.slug}`),
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...toolRoutes];
}
