import { LegalPage } from "@/components/legal/LegalPage";
import { privacyPolicy } from "@/content/legal";
import { siteMetadata } from "@/lib/seo";

export const metadata = siteMetadata({
  title: privacyPolicy.title,
  description: privacyPolicy.description,
  path: privacyPolicy.path,
});

export default function PrivacyPolicyPage() {
  return <LegalPage document={privacyPolicy} />;
}
