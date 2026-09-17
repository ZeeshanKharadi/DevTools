import { EmailDeliveryError, type EmailMessage, type EmailSender } from "./types";

export type ResendEmailSenderOptions = {
  apiKey: string;
  from: string;
  fetchImpl?: typeof fetch;
};

export function createResendEmailSender(
  options: ResendEmailSenderOptions,
): EmailSender {
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async send(message: EmailMessage) {
      let response: Response;
      try {
        response = await fetchImpl("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            authorization: `Bearer ${options.apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            from: options.from,
            to: [message.to],
            subject: message.subject,
            text: message.text,
            html: message.html,
          }),
        });
      } catch {
        throw new EmailDeliveryError("Could not reach the email provider.");
      }

      if (!response.ok) {
        let detail = "";
        try {
          const payload = (await response.json()) as {
            message?: unknown;
            name?: unknown;
          };
          const message =
            typeof payload.message === "string"
              ? payload.message
              : typeof payload.name === "string"
                ? payload.name
                : "";
          detail = message
            .replace(/re_[A-Za-z0-9]+/g, "[redacted]")
            .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
            .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[email]");
        } catch {
          detail = "";
        }
        throw new EmailDeliveryError(
          detail
            ? `The email provider rejected the message (${response.status}: ${detail}).`
            : `The email provider rejected the message (${response.status}).`,
        );
      }
    },
  };
}
