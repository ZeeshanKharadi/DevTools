import { SignaturesView } from "@/components/dashboard/SignaturesView";
import { siteMetadata } from "@/lib/seo";

export const metadata = {
  ...siteMetadata({
    title: "Saved Email Signatures",
    description: "Manage saved InfyraTools email signatures.",
    path: "/dashboard/signatures",
  }),
  robots: { index: false, follow: false },
};

export default function DashboardSignaturesPage() {
  return <SignaturesView />;
}
