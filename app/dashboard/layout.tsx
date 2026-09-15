import { Container } from "@/components/layout/Container";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Container className="py-10 sm:py-14">{children}</Container>;
}
