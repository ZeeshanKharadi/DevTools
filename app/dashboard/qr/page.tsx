import { QrView } from "@/components/dashboard/QrView";
import { siteMetadata } from "@/lib/seo";

export const metadata = {
  ...siteMetadata({
    title: "Dynamic QR Codes",
    description: "Create and manage InfyraTools dynamic QR codes.",
    path: "/dashboard/qr",
  }),
  robots: { index: false, follow: false },
};

export default function DashboardQrPage() {
  return <QrView />;
}
