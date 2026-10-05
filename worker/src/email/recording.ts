import { parsePasswordResetUrl, parseVerificationCode } from "./templates";
import type { EmailMessage, EmailSender } from "./types";

export class RecordingEmailSender implements EmailSender {
  readonly messages: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.messages.push(message);
  }

  last(): EmailMessage | null {
    return this.messages.at(-1) ?? null;
  }

  lastVerificationCode(): string | null {
    const last = this.last();
    return last ? parseVerificationCode(last.text) : null;
  }

  lastPasswordResetUrl(): string | null {
    for (let i = this.messages.length - 1; i >= 0; i -= 1) {
      const url = parsePasswordResetUrl(this.messages[i].text);
      if (url) {
        return url;
      }
    }
    return null;
  }
}
