import { createConsoleEmailSender } from "./console";
import { createResendEmailSender } from "./resend";
import { createUnconfiguredEmailSender } from "./unconfigured";
import type { EmailSender } from "./types";

export type EmailEnv = {
  EMAIL_PROVIDER?: string;
  EMAIL_FROM?: string;
  RESEND_API_KEY?: string;
};

const DEFAULT_FROM = "InfyraTools <noreply@infyratools.com>";

export function createEmailSenderFromEnv(env: EmailEnv): EmailSender {
  const from = env.EMAIL_FROM?.trim() || DEFAULT_FROM;
  const apiKey = env.RESEND_API_KEY?.trim();
  const provider = (env.EMAIL_PROVIDER ?? "").trim().toLowerCase();

  if (apiKey) {
    return createResendEmailSender({ apiKey, from });
  }

  if (provider === "console" || provider === "dev") {
    return createConsoleEmailSender();
  }

  return createUnconfiguredEmailSender();
}
