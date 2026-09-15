import { LoginForm } from "@/components/auth/LoginForm";
import { Container } from "@/components/layout/Container";
import { siteMetadata } from "@/lib/seo";

export const metadata = {
  ...siteMetadata({
    title: "Sign in",
    description: "Sign in to your InfyraTools account to save email signatures.",
    path: "/login",
  }),
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-md space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            InfyraTools
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted">
            Free tools still work without an account. Sign in to save signatures,
            host cards, manage dynamic QR codes, and keep invoices.
          </p>
        </header>
        <LoginForm />
      </div>
    </Container>
  );
}
