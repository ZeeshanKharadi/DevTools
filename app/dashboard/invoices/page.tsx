import { InvoicesView } from "@/components/dashboard/InvoicesView";
import { siteMetadata } from "@/lib/seo";

export const metadata = {
  ...siteMetadata({
    title: "Saved Invoices",
    description: "Manage saved InfyraTools invoices.",
    path: "/dashboard/invoices",
  }),
  robots: { index: false, follow: false },
};

export default function DashboardInvoicesPage() {
  return <InvoicesView />;
}
