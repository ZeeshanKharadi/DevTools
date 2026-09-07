import { LegalPage } from "@/components/legal/LegalPage";
import { disclaimer } from "@/content/legal";
import { siteMetadata } from "@/lib/seo";

export const metadata = siteMetadata({
  title: disclaimer.title,
  description: disclaimer.description,
  path: disclaimer.path,
});

export default function DisclaimerPage() {
  return <LegalPage document={disclaimer} />;
}
