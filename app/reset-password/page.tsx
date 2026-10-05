import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { Container } from "@/components/layout/Container";
import { siteMetadata } from "@/lib/seo";

export const metadata = {
  ...siteMetadata({
    title: "Reset password",
    description: "Choose a new password for your InfyraTools account.",
    path: "/reset-password",
  }),
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};

export default function ResetPasswordPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-md space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            InfyraTools
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Reset password</h1>
          <p className="text-sm text-muted">
            Choose a new password. You will need to sign in again after the reset.
          </p>
        </header>
        <ResetPasswordForm />
      </div>
    </Container>
  );
}
