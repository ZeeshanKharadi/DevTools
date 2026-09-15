import { CardsView } from "@/components/dashboard/CardsView";
import { siteMetadata } from "@/lib/seo";

export const metadata = {
  ...siteMetadata({
    title: "Hosted Business Cards",
    description: "Manage hosted InfyraTools digital business cards.",
    path: "/dashboard/cards",
  }),
  robots: { index: false, follow: false },
};

export default function DashboardCardsPage() {
  return <CardsView />;
}
