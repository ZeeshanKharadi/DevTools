import { RegisterForm } from "@/components/auth/RegisterForm";
import { Container } from "@/components/layout/Container";
import { siteMetadata } from "@/lib/seo";

export const metadata = {
  ...siteMetadata({
    title: "Create an account",
    description:
      "Register an InfyraTools account to save email signatures. No payment required.",
    path: "/register",
  }),
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-md space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            InfyraTools
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Create an account</h1>
          <p className="text-sm text-muted">
            InfyraTools Pro Beta — Complimentary access to all Pro features
            during beta. No payment method required. We’ll email a 6-digit
            code to verify new accounts. Free tools still work without
            registering.
          </p>
        </header>
        <RegisterForm />
      </div>
    </Container>
  );
}
