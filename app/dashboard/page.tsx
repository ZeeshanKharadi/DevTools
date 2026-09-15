import { SummaryView } from "@/components/dashboard/SummaryView";
import { siteMetadata } from "@/lib/seo";

export const metadata = {
  ...siteMetadata({
    title: "Dashboard",
    description: "Manage saved InfyraTools signatures, cards, QR codes, and invoices.",
    path: "/dashboard",
  }),
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <SummaryView />;
}
