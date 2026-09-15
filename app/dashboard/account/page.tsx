import { AccountView } from "@/components/dashboard/AccountView";
import { siteMetadata } from "@/lib/seo";

export const metadata = {
  ...siteMetadata({
    title: "Account",
    description: "Manage your InfyraTools account and optional business profile.",
    path: "/dashboard/account",
  }),
  robots: { index: false, follow: false },
};

export default function DashboardAccountPage() {
  return <AccountView />;
}
