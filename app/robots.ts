import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/login",
        "/register",
        "/verify-email",
        "/forgot-password",
        "/reset-password",
        "/dashboard",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
