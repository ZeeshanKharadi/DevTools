import type { Clock } from "../clock";
import { addMs, toIso } from "../clock";
import type { Repositories } from "../db/repositories";
import { toPublicUser, type PublicUser, type SessionRecord } from "../db/types";
import { createId, normalizeEmail, validatePassword } from "../ids";
import { hashPassword, verifyPassword } from "../passwords";
import { createSessionToken, hashToken } from "../session-token";

export const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;
export const LOGIN_LIMIT = 10;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const REGISTER_LIMIT = 5;
export const REGISTER_WINDOW_MS = 60 * 60 * 1000;

export class AuthError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export type AuthService = {
  register(input: {
    email: string;
    password: string;
    ip: string;
  }): Promise<{ user: PublicUser; token: string }>;
  login(input: {
    email: string;
    password: string;
    ip: string;
  }): Promise<{ user: PublicUser; token: string }>;
  logout(token: string | null): Promise<void>;
  me(token: string | null): Promise<PublicUser>;
};

export function createAuthService(
  repos: Repositories,
  clock: Clock,
): AuthService {
  async function createSession(userId: string): Promise<string> {
    const now = clock.now();
    const { token, tokenHash } = await createSessionToken();
    const session: SessionRecord = {
      id: tokenHash,
      userId,
      createdAt: toIso(now),
      lastUsedAt: toIso(now),
      expiresAt: toIso(addMs(now, SESSION_TTL_MS)),
    };
    await repos.sessions.create(session);
    return token;
  }

  async function readSession(token: string | null) {
    if (!token) {
      throw new AuthError(401, "unauthenticated", "Sign in to continue.");
    }

    const now = clock.now();
    const nowIso = toIso(now);
    const tokenHash = await hashToken(token);
    const session = await repos.sessions.findById(tokenHash, nowIso);

    if (!session) {
      await repos.sessions.deleteIfExpired(tokenHash, nowIso);
      throw new AuthError(401, "unauthenticated", "Sign in to continue.");
    }

    if (session.expiresAt <= nowIso) {
      await repos.sessions.delete(session.id);
      throw new AuthError(401, "unauthenticated", "Sign in to continue.");
    }

    const user = await repos.users.findById(session.userId);
    if (!user) {
      await repos.sessions.delete(session.id);
      throw new AuthError(401, "unauthenticated", "Sign in to continue.");
    }

    const lastUsed = new Date(session.lastUsedAt).getTime();
    if (now.getTime() - lastUsed > 60 * 60 * 1000) {
      await repos.sessions.touch(session.id, toIso(now));
    }

    return { user, session };
  }

  return {
    async register({ email, password, ip }) {
      const normalized = normalizeEmail(email);
      if (!normalized) {
        throw new AuthError(400, "invalid_email", "Enter a valid email address.");
      }

      const passwordError = validatePassword(password, normalized);
      if (passwordError) {
        throw new AuthError(400, "invalid_password", passwordError);
      }

      const hits = await repos.rateLimits.hit(
        "register",
        ip || "unknown",
        toIso(clock.now()),
        REGISTER_WINDOW_MS,
      );
      if (hits > REGISTER_LIMIT) {
        throw new AuthError(
          429,
          "rate_limited",
          "Too many registration attempts. Try again later.",
        );
      }

      const now = toIso(clock.now());
      try {
        await repos.users.create({
          id: createId(),
          email: normalized,
          passwordHash: await hashPassword(password),
          createdAt: now,
          updatedAt: now,
        });
      } catch (error) {
        if (error instanceof Error && error.message === "UNIQUE_EMAIL") {
          throw new AuthError(
            409,
            "email_taken",
            "An account with this email already exists.",
          );
        }
        throw error;
      }

      const user = await repos.users.findByEmail(normalized);
      if (!user) {
        throw new AuthError(500, "server_error", "Could not create the account.");
      }

      const token = await createSession(user.id);
      return { user: toPublicUser(user), token };
    },

    async login({ email, password, ip }) {
      const hits = await repos.rateLimits.hit(
        "login",
        ip || "unknown",
        toIso(clock.now()),
        LOGIN_WINDOW_MS,
      );
      if (hits > LOGIN_LIMIT) {
        throw new AuthError(
          429,
          "rate_limited",
          "Too many sign-in attempts. Try again later.",
        );
      }

      const invalid = new AuthError(
        401,
        "invalid_credentials",
        "Invalid email or password.",
      );
      const normalized = normalizeEmail(email);
      if (!normalized) {
        throw invalid;
      }

      const user = await repos.users.findByEmail(normalized);
      if (!user) {
        await hashPassword(password);
        throw invalid;
      }

      const matches = await verifyPassword(password, user.passwordHash);
      if (!matches) {
        throw invalid;
      }

      const token = await createSession(user.id);
      return { user: toPublicUser(user), token };
    },

    async logout(token) {
      if (!token) {
        return;
      }

      const tokenHash = await hashToken(token);
      await repos.sessions.delete(tokenHash);
    },

    async me(token) {
      const { user } = await readSession(token);
      return toPublicUser(user);
    },
  };
}
