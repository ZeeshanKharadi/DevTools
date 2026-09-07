import { LegalPage } from "@/components/legal/LegalPage";
import { termsOfUse } from "@/content/legal";
import { siteMetadata } from "@/lib/seo";

export const metadata = siteMetadata({
  title: termsOfUse.title,
  description: termsOfUse.description,
  path: termsOfUse.path,
});

export default function TermsPage() {
  return <LegalPage document={termsOfUse} />;
}
