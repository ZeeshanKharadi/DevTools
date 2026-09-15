import { describe, expect, it } from "vitest";
import { createApp } from "./app";
import { createMemoryRepositories } from "./db/memory";
import { SESSION_COOKIE } from "./http";
import { addMs } from "./clock";
import { EXAMPLE_INPUT } from "../../lib/tools/email-signature-generator/constants";

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

  const app = createApp({
    repos: createMemoryRepositories(),
    clock,
    config: {
      allowedOrigins: [ORIGIN],
      cookieSecure: false,
      cookieSameSite: "Lax",
      publicBaseUrl: "https://infyratools.com",
    },
  });

  return { app, clock };
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

const password = "correct-horse-battery";

describe("auth API", () => {
  it("registers, logs in, reads the session, and logs out", async () => {
    const { app } = makeApp();
    const registered = await request(app, "POST", "/api/auth/register", {
      body: { email: "Ada@Example.com", password },
    });
    expect(registered.status).toBe(201);
    const created = (await registered.json()) as { user: { email: string } };
    expect(created.user.email).toBe("ada@example.com");
    expect(created.user).not.toHaveProperty("passwordHash");
    expect(created.user).not.toHaveProperty("password_hash");
    const token = cookieFrom(registered);
    expect(token).toBeTruthy();

    const me = await request(app, "GET", "/api/auth/me", { cookie: token });
    expect(me.status).toBe(200);

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

describe("signature API", () => {
  async function signedIn() {
    const ctx = makeApp();
    const registered = await request(ctx.app, "POST", "/api/auth/register", {
      body: { email: "owner@example.com", password },
    });
    return { ...ctx, cookie: cookieFrom(registered)! };
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
    const { app } = makeApp();
    const owner = await request(app, "POST", "/api/auth/register", {
      body: { email: "owner@example.com", password },
    });
    const ownerCookie = cookieFrom(owner);
    const created = await request(app, "POST", "/api/signatures", {
      cookie: ownerCookie,
      body: { name: "Private", data: EXAMPLE_INPUT },
    });
    const id = ((await created.json()) as { signature: { id: string } }).signature.id;

    const other = await request(app, "POST", "/api/auth/register", {
      body: { email: "intruder@example.com", password },
    });
    const otherCookie = cookieFrom(other);

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
