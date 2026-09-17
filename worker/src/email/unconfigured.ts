import { EmailDeliveryError, type EmailSender } from "./types";

export function createUnconfiguredEmailSender(): EmailSender {
  return {
    async send() {
      throw new EmailDeliveryError(
        "Email delivery is not configured. Set EMAIL_PROVIDER=console for local development or RESEND_API_KEY for production.",
      );
    },
  };
}
