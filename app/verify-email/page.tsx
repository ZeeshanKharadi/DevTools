import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { Container } from "@/components/layout/Container";
import { siteMetadata } from "@/lib/seo";

export const metadata = {
  ...siteMetadata({
    title: "Verify your email",
    description: "Enter the 6-digit code sent to your email to finish creating your InfyraTools account.",
    path: "/verify-email",
  }),
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-md space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            InfyraTools
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Verify your email</h1>
          <p className="text-sm text-muted">
            New accounts need a one-time code before dashboard access. InfyraTools
            Pro Beta remains complimentary during beta, with no payment method
            required.
          </p>
        </header>
        <VerifyEmailForm />
      </div>
    </Container>
  );
}
