import type { EmailMessage, EmailSender } from "./types";

export function createConsoleEmailSender(): EmailSender {
  return {
    async send(message: EmailMessage) {
      console.info(
        `[infyratools-email] to=${message.to} subject=${message.subject}\n${message.text}`,
      );
    },
  };
}
