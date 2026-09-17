import { describe, expect, it } from "vitest";
import { createEmailSenderFromEnv } from "./from-env";
import { createResendEmailSender } from "./resend";
import { EmailDeliveryError } from "./types";
import { parseVerificationCode, verificationEmail } from "./templates";

describe("email providers", () => {
  it("builds a verification message without putting the code in the subject", () => {
    const message = verificationEmail("ada@example.com", "123456");
    expect(message.subject).toBe("Your InfyraTools verification code");
    expect(message.subject).not.toContain("123456");
    expect(parseVerificationCode(message.text)).toBe("123456");
    expect(message.html).toContain("123456");
    expect(message.to).toBe("ada@example.com");
  });

  it("throws a delivery error when no provider is configured", async () => {
    const missing = createEmailSenderFromEnv({});
    await expect(
      missing.send(verificationEmail("ada@example.com", "123456")),
    ).rejects.toBeInstanceOf(EmailDeliveryError);
  });

  it("sends Resend JSON without echoing the API key in errors", async () => {
    const calls: string[] = [];
    const sender = createResendEmailSender({
      apiKey: "re_secret_value",
      from: "InfyraTools <noreply@infyratools.com>",
      fetchImpl: async (input, init) => {
        calls.push(String(input));
        expect(String(init?.headers)).not.toContain("re_secret_value");
        const headers = new Headers(init?.headers);
        expect(headers.get("authorization")).toBe("Bearer re_secret_value");
        const body = JSON.parse(String(init?.body)) as {
          to: string[];
          subject: string;
        };
        expect(body.to).toEqual(["ada@example.com"]);
        expect(body.subject).toContain("verification");
        return new Response("{}", { status: 200 });
      },
    });

    await sender.send(verificationEmail("ada@example.com", "654321"));
    expect(calls).toHaveLength(1);
  });

  it("maps provider failures to EmailDeliveryError without leaking secrets", async () => {
    const sender = createResendEmailSender({
      apiKey: "re_secret_value",
      from: "InfyraTools <noreply@infyratools.com>",
      fetchImpl: async () => new Response("nope", { status: 401 }),
    });

    await expect(
      sender.send(verificationEmail("ada@example.com", "654321")),
    ).rejects.toMatchObject({
      name: "EmailDeliveryError",
      message: "The email provider rejected the message (401).",
    });

    try {
      await sender.send(verificationEmail("ada@example.com", "654321"));
    } catch (error) {
      expect(String(error)).not.toContain("re_secret_value");
    }
  });
});
