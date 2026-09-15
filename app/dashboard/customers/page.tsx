import { CustomersView } from "@/components/dashboard/CustomersView";
import { siteMetadata } from "@/lib/seo";

export const metadata = {
  ...siteMetadata({
    title: "Customers",
    description: "Manage a simple InfyraTools customer directory for invoices.",
    path: "/dashboard/customers",
  }),
  robots: { index: false, follow: false },
};

export default function DashboardCustomersPage() {
  return <CustomersView />;
}
