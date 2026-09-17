import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import { createMemoryRepositories } from "./db/memory";
import { RecordingEmailSender } from "./email";
import { SESSION_COOKIE } from "./http";
import { addMs } from "./clock";
import { hashPassword } from "./passwords";
import { OTP_TTL_MS } from "./otp";
import { EXAMPLE_INPUT } from "../../lib/tools/email-signature-generator/constants";
import { RESEND_COOLDOWN_MS } from "./services/auth-service";

const ORIGIN = "http://localhost:3000";

function cookieFrom(response: Response): string | null {
  const header = response.headers.get("set-cookie");
  if (!header) {
    return null;
  }

  const match = header.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function makeApp(now = new Date("2026-09-14T12:00:00.000Z")) {
  let current = now;
  const clock = {
    now() {
      return current;
    },
    set(date: Date) {
      current = date;
    },
  };

  const repos = createMemoryRepositories();
  const emails = new RecordingEmailSender();
  const app = createApp({
    repos,
    clock,
    email: emails,
    config: {
      allowedOrigins: [ORIGIN],
      cookieSecure: false,
      cookieSameSite: "Lax",
      publicBaseUrl: "https://infyratools.com",
    },
  });

  return { app, clock, emails, repos };
}

async function request(
  app: ReturnType<typeof createApp>,
  method: string,
  path: string,
  options: {
    body?: unknown;
    cookie?: string | null;
    origin?: string;
    ip?: string;
  } = {},
) {
  const headers = new Headers();
  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
  }
  if (options.cookie) {
    headers.set("cookie", `${SESSION_COOKIE}=${encodeURIComponent(options.cookie)}`);
  }
  if (options.origin) {
    headers.set("origin", options.origin);
  }
  if (options.ip) {
    headers.set("cf-connecting-ip", options.ip);
  }

  return app.fetch(
    new Request(`https://infyratools.com${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    }),
  );
}

async function registerAndVerify(
  app: ReturnType<typeof createApp>,
  emails: RecordingEmailSender,
  email: string,
) {
  const registered = await request(app, "POST", "/api/auth/register", {
    body: { email, password },
  });
  expect(registered.status).toBe(201);
  const cookie = cookieFrom(registered);
  const code = emails.lastVerificationCode();
  expect(code).toBeTruthy();
  const verified = await request(app, "POST", "/api/auth/verify-email", {
    cookie,
    body: { code },
  });
  expect(verified.status).toBe(200);
  return cookie!;
}

const password = "correct-horse-battery";

describe("auth API", () => {
  it("registers, logs in, reads the session, and logs out", async () => {
    const { app } = makeApp();
    const registered = await request(app, "POST", "/api/auth/register", {
      body: { email: "Ada@Example.com", password },
    });
    expect(registered.status).toBe(201);
    const created = (await registered.json()) as {
      user: { email: string; emailVerified: boolean };
      emailSent: boolean;
    };
    expect(created.user.email).toBe("ada@example.com");
    expect(created.user.emailVerified).toBe(false);
    expect(created.emailSent).toBe(true);
    expect(created.user).not.toHaveProperty("passwordHash");
    expect(created.user).not.toHaveProperty("password_hash");
    const token = cookieFrom(registered);
    expect(token).toBeTruthy();

    const me = await request(app, "GET", "/api/auth/me", { cookie: token });
    expect(me.status).toBe(200);
    const meBody = (await me.json()) as { user: { emailVerified: boolean } };
    expect(meBody.user.emailVerified).toBe(false);
    expect((await request(app, "GET", "/api/signatures", { cookie: token })).status).toBe(
      403,
    );

    const loggedOut = await request(app, "POST", "/api/auth/logout", { cookie: token });
    expect(loggedOut.status).toBe(200);
    expect((await request(app, "GET", "/api/auth/me", { cookie: token })).status).toBe(401);

    const login = await request(app, "POST", "/api/auth/login", {
      body: { email: "ada@example.com", password },
    });
    expect(login.status).toBe(200);
    expect(cookieFrom(login)).toBeTruthy();
  });

  it("rejects a duplicate email", async () => {
    const { app } = makeApp();
    await request(app, "POST", "/api/auth/register", {
      body: { email: "sam@example.com", password },
    });
    const duplicate = await request(app, "POST", "/api/auth/register", {
      body: { email: "sam@example.com", password },
    });
    expect(duplicate.status).toBe(409);
  });

  it("rejects a wrong password without revealing whether the email exists", async () => {
    const { app } = makeApp();
    await request(app, "POST", "/api/auth/register", {
      body: { email: "sam@example.com", password },
    });
    const failed = await request(app, "POST", "/api/auth/login", {
      body: { email: "sam@example.com", password: "wrong-password-value" },
    });
    const missing = await request(app, "POST", "/api/auth/login", {
      body: { email: "nobody@example.com", password: "wrong-password-value" },
    });
    expect(failed.status).toBe(401);
    expect(missing.status).toBe(401);
    const failedBody = (await failed.json()) as { error: { message: string } };
    const missingBody = (await missing.json()) as { error: { message: string } };
    expect(failedBody.error.message).toBe(missingBody.error.message);
  });

  it("rejects a password that is too short", async () => {
    const { app } = makeApp();
    const response = await request(app, "POST", "/api/auth/register", {
      body: { email: "sam@example.com", password: "short" },
    });
    expect(response.status).toBe(400);
  });

  it("rejects mutating requests from a disallowed origin", async () => {
    const { app } = makeApp();
    const response = await request(app, "POST", "/api/auth/login", {
      body: { email: "sam@example.com", password },
      origin: "https://evil.example",
    });
    expect(response.status).toBe(403);
  });

  it("rejects expired and missing sessions", async () => {
    const { app, clock } = makeApp();
    const registered = await request(app, "POST", "/api/auth/register", {
      body: { email: "sam@example.com", password },
    });
    const token = cookieFrom(registered);
    clock.set(addMs(clock.now(), 15 * 24 * 60 * 60 * 1000));
    expect((await request(app, "GET", "/api/auth/me", { cookie: token })).status).toBe(401);
    expect((await request(app, "GET", "/api/auth/me")).status).toBe(401);
    expect((await request(app, "GET", "/api/signatures")).status).toBe(401);
  });
});

describe("email verification", () => {
  it("verifies a hashed single-use OTP and then allows dashboard access", async () => {
    const { app, emails } = makeApp();
    const registered = await request(app, "POST", "/api/auth/register", {
      body: { email: "ada@example.com", password },
    });
    const cookie = cookieFrom(registered);
    const sent = emails.last();
    expect(sent?.text).toContain("Your verification code is:");
    const code = emails.lastVerificationCode();
    expect(code).toMatch(/^\d{6}$/);
    expect(JSON.stringify(sent)).not.toContain("otpHash");

    const wrong = await request(app, "POST", "/api/auth/verify-email", {
      cookie,
      body: { code: "000000" },
    });
    expect(wrong.status).toBe(400);
    const wrongBody = (await wrong.json()) as { error: { code: string; message: string } };

    const verified = await request(app, "POST", "/api/auth/verify-email", {
      cookie,
      body: { code },
    });
    expect(verified.status).toBe(200);
    const verifiedBody = (await verified.json()) as { user: { emailVerified: boolean } };
    expect(verifiedBody.user.emailVerified).toBe(true);

    const reused = await request(app, "POST", "/api/auth/verify-email", {
      cookie,
      body: { code },
    });
    expect(reused.status).toBe(200);

    expect((await request(app, "GET", "/api/signatures", { cookie })).status).toBe(200);

    const missing = await request(app, "POST", "/api/auth/verify-email", {
      body: { code: "123456" },
    });
    expect(missing.status).toBe(401);
    expect(wrongBody.error.message).toBe("That code is invalid or has expired.");
  });

  it("rejects an expired OTP with the same message as a wrong OTP", async () => {
    const { app, clock, emails } = makeApp();
    const registered = await request(app, "POST", "/api/auth/register", {
      body: { email: "ada@example.com", password },
    });
    const cookie = cookieFrom(registered);
    const code = emails.lastVerificationCode();
    clock.set(addMs(clock.now(), OTP_TTL_MS + 1000));
    const expired = await request(app, "POST", "/api/auth/verify-email", {
      cookie,
      body: { code },
    });
    const wrong = await request(app, "POST", "/api/auth/verify-email", {
      cookie,
      body: { code: "999999" },
    });
    expect(expired.status).toBe(400);
    expect(wrong.status).toBe(400);
    const expiredBody = (await expired.json()) as { error: { message: string } };
    const wrongBody = (await wrong.json()) as { error: { message: string } };
    expect(expiredBody.error.message).toBe(wrongBody.error.message);
  });

  it("invalidates the previous OTP when a new code is resent", async () => {
    const { app, clock, emails } = makeApp();
    const registered = await request(app, "POST", "/api/auth/register", {
      body: { email: "ada@example.com", password },
    });
    const cookie = cookieFrom(registered);
    const first = emails.lastVerificationCode();
    clock.set(addMs(clock.now(), RESEND_COOLDOWN_MS));
    const resent = await request(app, "POST", "/api/auth/resend-verification", {
      cookie,
    });
    expect(resent.status).toBe(200);
    const second = emails.lastVerificationCode();
    expect(second).toBeTruthy();
    expect(second).not.toBe(first);

    const oldCode = await request(app, "POST", "/api/auth/verify-email", {
      cookie,
      body: { code: first },
    });
    expect(oldCode.status).toBe(400);

    const verified = await request(app, "POST", "/api/auth/verify-email", {
      cookie,
      body: { code: second },
    });
    expect(verified.status).toBe(200);
  });

  it("rate-limits verification attempts and does not leak codes to another user", async () => {
    const { app, emails } = makeApp();
    const ownerRegistered = await request(app, "POST", "/api/auth/register", {
      body: { email: "owner@example.com", password },
      ip: "1.1.1.1",
    });
    const ownerCookie = cookieFrom(ownerRegistered);
    const ownerCode = emails.lastVerificationCode();
    const otherRegistered = await request(app, "POST", "/api/auth/register", {
      body: { email: "other@example.com", password },
      ip: "2.2.2.2",
    });
    const otherCookie = cookieFrom(otherRegistered);

    const stolen = await request(app, "POST", "/api/auth/verify-email", {
      cookie: otherCookie,
      body: { code: ownerCode },
      ip: "2.2.2.2",
    });
    expect(stolen.status).toBe(400);

    for (let i = 0; i < 8; i += 1) {
      const attempt = await request(app, "POST", "/api/auth/verify-email", {
        cookie: ownerCookie,
        body: { code: "000000" },
        ip: "1.1.1.1",
      });
      expect(attempt.status).toBe(400);
    }
    const limited = await request(app, "POST", "/api/auth/verify-email", {
      cookie: ownerCookie,
      body: { code: ownerCode },
      ip: "1.1.1.1",
    });
    expect(limited.status).toBe(429);
  });

  it("lets grandfathered verified users sign in without an OTP", async () => {
    const { app, repos } = makeApp();
    const now = "2026-09-14T12:00:00.000Z";
    await repos.users.create({
      id: "legacy-user",
      email: "legacy@example.com",
      passwordHash: await hashPassword(password),
      emailVerifiedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    const login = await request(app, "POST", "/api/auth/login", {
      body: { email: "legacy@example.com", password },
    });
    expect(login.status).toBe(200);
    const cookie = cookieFrom(login);
    const me = (await (await request(app, "GET", "/api/auth/me", { cookie })).json()) as {
      user: { emailVerified: boolean };
    };
    expect(me.user.emailVerified).toBe(true);
    expect((await request(app, "GET", "/api/signatures", { cookie })).status).toBe(200);
  });
});

describe("signature API", () => {
  async function signedIn() {
    const ctx = makeApp();
    const cookie = await registerAndVerify(
      ctx.app,
      ctx.emails,
      "owner@example.com",
    );
    return { ...ctx, cookie };
  }

  it("creates, lists, edits, duplicates, and deletes a signature", async () => {
    const { app, cookie } = await signedIn();
    const created = await request(app, "POST", "/api/signatures", {
      cookie,
      body: { name: "Work Signature", data: EXAMPLE_INPUT },
    });
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as { signature: { id: string; name: string } };
    const id = createdBody.signature.id;

    const fetched = await request(app, "GET", `/api/signatures/${id}`, { cookie });
    expect(fetched.status).toBe(200);

    const list = await request(app, "GET", "/api/signatures", { cookie });
    const listBody = (await list.json()) as { signatures: { id: string }[] };
    expect(listBody.signatures).toHaveLength(1);

    const updated = await request(app, "PUT", `/api/signatures/${id}`, {
      cookie,
      body: {
        name: "Office Signature",
        data: {
          ...EXAMPLE_INPUT,
          fields: { ...EXAMPLE_INPUT.fields, fullName: "Ada Lovelace" },
        },
      },
    });
    expect(updated.status).toBe(200);
    const updatedBody = (await updated.json()) as {
      signature: { name: string; data: { fields: { fullName: string } } };
    };
    expect(updatedBody.signature.name).toBe("Office Signature");
    expect(updatedBody.signature.data.fields.fullName).toBe("Ada Lovelace");

    const duplicated = await request(app, "POST", `/api/signatures/${id}/duplicate`, {
      cookie,
    });
    expect(duplicated.status).toBe(201);

    const listed = (await (
      await request(app, "GET", "/api/signatures", { cookie })
    ).json()) as { signatures: { name: string }[] };
    expect(listed.signatures).toHaveLength(2);

    const deleted = await request(app, "DELETE", `/api/signatures/${id}`, { cookie });
    expect(deleted.status).toBe(200);
    expect((await request(app, "GET", `/api/signatures/${id}`, { cookie })).status).toBe(404);
  });

  it("rejects unauthenticated writes and cross-user reads", async () => {
    const { app, emails } = makeApp();
    const ownerCookie = await registerAndVerify(app, emails, "owner@example.com");
    const created = await request(app, "POST", "/api/signatures", {
      cookie: ownerCookie,
      body: { name: "Private", data: EXAMPLE_INPUT },
    });
    const id = ((await created.json()) as { signature: { id: string } }).signature.id;

    const otherCookie = await registerAndVerify(app, emails, "intruder@example.com");

    expect((await request(app, "GET", `/api/signatures/${id}`)).status).toBe(401);
    expect(
      (await request(app, "GET", `/api/signatures/${id}`, { cookie: otherCookie })).status,
    ).toBe(404);
    expect(
      (await request(app, "DELETE", `/api/signatures/${id}`, { cookie: otherCookie })).status,
    ).toBe(404);
    expect(
      (await request(app, "PUT", `/api/signatures/${id}`, {
        cookie: otherCookie,
        body: { name: "Stolen" },
      })).status,
    ).toBe(404);
    const otherList = (await (
      await request(app, "GET", "/api/signatures", { cookie: otherCookie })
    ).json()) as { signatures: { id: string }[] };
    expect(otherList.signatures).toHaveLength(0);
  });
});
