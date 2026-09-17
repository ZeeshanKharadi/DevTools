import type { EmailMessage } from "./types";

export const VERIFICATION_CODE_LABEL = "Your verification code is:";

export function verificationEmail(to: string, code: string): EmailMessage {
  const text = [
    "InfyraTools",
    "",
    `${VERIFICATION_CODE_LABEL} ${code}`,
    "",
    "This code expires in 10 minutes and can be used once.",
    "If you did not create an InfyraTools account, you can ignore this email.",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;">
      <tr>
        <td style="padding:28px 28px 8px;">
          <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;">InfyraTools</p>
          <h1 style="margin:12px 0 0;font-size:22px;line-height:1.3;">Verify your email</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 28px 0;font-size:15px;line-height:1.5;color:#3f3f46;">
          Use this code to finish creating your InfyraTools account. It expires in 10 minutes and can be used once.
        </td>
      </tr>
      <tr>
        <td style="padding:20px 28px;">
          <p style="margin:0;padding:16px;text-align:center;font-size:28px;letter-spacing:0.24em;font-weight:700;background:#f4f4f5;border-radius:8px;">
            ${code}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px 28px;font-size:13px;line-height:1.5;color:#71717a;">
          If you did not create an InfyraTools account, you can ignore this email.
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    to,
    subject: "Your InfyraTools verification code",
    text,
    html,
  };
}

export function parseVerificationCode(text: string): string | null {
  const match = text.match(new RegExp(`${VERIFICATION_CODE_LABEL} (\\d{6})`));
  return match?.[1] ?? null;
}
