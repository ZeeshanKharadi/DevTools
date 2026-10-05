import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { Container } from "@/components/layout/Container";
import { siteMetadata } from "@/lib/seo";

export const metadata = {
  ...siteMetadata({
    title: "Forgot password",
    description: "Request a password reset link for your InfyraTools account.",
    path: "/forgot-password",
  }),
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-md space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            InfyraTools
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Forgot password</h1>
          <p className="text-sm text-muted">
            Enter your email and we will send a reset link if an account exists.
          </p>
        </header>
        <ForgotPasswordForm />
      </div>
    </Container>
  );
}
