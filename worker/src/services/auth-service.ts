import type { Clock } from "../clock";
import { addMs, toIso } from "../clock";
import type { Repositories } from "../db/repositories";
import { toPublicUser, type PublicUser, type SessionRecord } from "../db/types";
import {
  EmailDeliveryError,
  passwordResetConfirmationEmail,
  passwordResetEmail,
  type EmailSender,
  verificationEmail,
} from "../email";
import { createId, normalizeEmail, validatePassword } from "../ids";
import {
  dummyOtpCompare,
  generateOtp,
  hashOtp,
  normalizeOtp,
  OTP_MAX_FAILED_ATTEMPTS,
  OTP_TTL_MS,
  verifyOtp,
} from "../otp";
import { hashPassword, verifyPassword } from "../passwords";
import { createSessionToken, hashToken } from "../session-token";

export const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;
export const LOGIN_LIMIT = 10;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const REGISTER_LIMIT = 5;
export const REGISTER_WINDOW_MS = 60 * 60 * 1000;
export const VERIFY_LIMIT = 8;
export const VERIFY_WINDOW_MS = 15 * 60 * 1000;
export const VERIFY_IP_LIMIT = 20;
export const RESEND_LIMIT = 3;
export const RESEND_WINDOW_MS = 15 * 60 * 1000;
export const RESEND_IP_LIMIT = 8;
export const RESEND_IP_WINDOW_MS = 60 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
export const FORGOT_PASSWORD_LIMIT = 3;
export const FORGOT_PASSWORD_WINDOW_MS = 15 * 60 * 1000;
export const FORGOT_PASSWORD_IP_LIMIT = 10;
export const FORGOT_PASSWORD_IP_WINDOW_MS = 60 * 60 * 1000;
export const RESET_PASSWORD_LIMIT = 8;
export const RESET_PASSWORD_WINDOW_MS = 15 * 60 * 1000;

const INVALID_CODE_MESSAGE = "That code is invalid or has expired.";
const INVALID_RESET_MESSAGE = "That reset link is invalid or has expired.";
export const FORGOT_PASSWORD_MESSAGE =
  "If an account exists for this email, you will receive a password reset link.";

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
  }): Promise<{ user: PublicUser; token: string; emailSent: boolean }>;
  login(input: {
    email: string;
    password: string;
    ip: string;
  }): Promise<{ user: PublicUser; token: string }>;
  logout(token: string | null): Promise<void>;
  me(token: string | null): Promise<PublicUser>;
  requireVerified(token: string | null): Promise<PublicUser>;
  verifyEmail(input: {
    token: string | null;
    code: unknown;
    ip: string;
  }): Promise<PublicUser>;
  resendVerification(input: {
    token: string | null;
    ip: string;
  }): Promise<{ emailSent: boolean; alreadyVerified: boolean }>;
  requestPasswordReset(input: {
    email: string;
    ip: string;
  }): Promise<{ message: string }>;
  resetPassword(input: {
    token: unknown;
    password: string;
    ip: string;
  }): Promise<{ ok: true }>;
};

export function createAuthService(
  repos: Repositories,
  clock: Clock,
  emailSender: EmailSender,
  publicBaseUrl: string,
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

  async function sendVerification(userId: string, address: string): Promise<boolean> {
    const now = clock.now();
    const nowIso = toIso(now);
    const otp = generateOtp();
    await repos.verifications.consumeAllForUser(userId, nowIso);
    await repos.verifications.create({
      id: createId(),
      userId,
      otpHash: await hashOtp(otp),
      expiresAt: toIso(addMs(now, OTP_TTL_MS)),
      consumedAt: null,
      failedAttempts: 0,
      createdAt: nowIso,
    });

    try {
      await emailSender.send(verificationEmail(address, otp));
      return true;
    } catch (error) {
      if (error instanceof EmailDeliveryError) {
        console.error("email_delivery_failed", error.message);
        return false;
      }
      throw error;
    }
  }

  async function enforceLimit(
    action: string,
    key: string,
    limit: number,
    windowMs: number,
    message: string,
  ) {
    const hits = await repos.rateLimits.hit(
      action,
      key || "unknown",
      toIso(clock.now()),
      windowMs,
    );
    if (hits > limit) {
      throw new AuthError(429, "rate_limited", message);
    }
  }

  function normalizeResetToken(raw: unknown): string | null {
    if (typeof raw !== "string") {
      return null;
    }
    const token = raw.trim();
    if (!token || token.length > 200) {
      return null;
    }
    return token;
  }

  const unverifiedError = new AuthError(
    403,
    "email_unverified",
    "Verify your email to continue.",
  );

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

      await enforceLimit(
        "register",
        ip || "unknown",
        REGISTER_LIMIT,
        REGISTER_WINDOW_MS,
        "Too many registration attempts. Try again later.",
      );

      const now = toIso(clock.now());
      try {
        await repos.users.create({
          id: createId(),
          email: normalized,
          passwordHash: await hashPassword(password),
          emailVerifiedAt: null,
          stripeCustomerId: null,
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

      const emailSent = await sendVerification(user.id, user.email);
      const token = await createSession(user.id);
      return { user: toPublicUser(user), token, emailSent };
    },

    async login({ email, password, ip }) {
      await enforceLimit(
        "login",
        ip || "unknown",
        LOGIN_LIMIT,
        LOGIN_WINDOW_MS,
        "Too many sign-in attempts. Try again later.",
      );

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

    async requireVerified(token) {
      const { user } = await readSession(token);
      if (!user.emailVerifiedAt) {
        throw unverifiedError;
      }
      return toPublicUser(user);
    },

    async verifyEmail({ token, code, ip }) {
      const { user } = await readSession(token);

      await enforceLimit(
        "verify_email",
        user.id,
        VERIFY_LIMIT,
        VERIFY_WINDOW_MS,
        "Too many verification attempts. Try again later.",
      );
      await enforceLimit(
        "verify_email_ip",
        ip || "unknown",
        VERIFY_IP_LIMIT,
        VERIFY_WINDOW_MS,
        "Too many verification attempts. Try again later.",
      );

      if (user.emailVerifiedAt) {
        return toPublicUser(user);
      }

      const now = clock.now();
      const nowIso = toIso(now);
      const otp = normalizeOtp(code);
      const challenge = await repos.verifications.findActiveByUserId(user.id, nowIso);

      if (!otp || !challenge) {
        await dummyOtpCompare(otp ?? "000000");
        throw new AuthError(400, "invalid_code", INVALID_CODE_MESSAGE);
      }

      const matches = await verifyOtp(otp, challenge.otpHash);
      if (!matches) {
        const failures = await repos.verifications.incrementFailures(challenge.id);
        if (failures >= OTP_MAX_FAILED_ATTEMPTS) {
          await repos.verifications.consume(challenge.id, nowIso);
        }
        throw new AuthError(400, "invalid_code", INVALID_CODE_MESSAGE);
      }

      await repos.verifications.consume(challenge.id, nowIso);
      await repos.users.markEmailVerified(user.id, nowIso);
      const verified = await repos.users.findById(user.id);
      if (!verified) {
        throw new AuthError(500, "server_error", "Could not verify the account.");
      }
      return toPublicUser(verified);
    },

    async resendVerification({ token, ip }) {
      const { user } = await readSession(token);

      await enforceLimit(
        "resend_otp",
        user.id,
        RESEND_LIMIT,
        RESEND_WINDOW_MS,
        "Too many resend attempts. Try again later.",
      );
      await enforceLimit(
        "resend_otp_ip",
        ip || "unknown",
        RESEND_IP_LIMIT,
        RESEND_IP_WINDOW_MS,
        "Too many resend attempts. Try again later.",
      );

      if (user.emailVerifiedAt) {
        return { emailSent: false, alreadyVerified: true };
      }

      const latest = await repos.verifications.findLatestByUserId(user.id);
      if (latest) {
        const elapsed = clock.now().getTime() - new Date(latest.createdAt).getTime();
        if (elapsed < RESEND_COOLDOWN_MS) {
          throw new AuthError(
            429,
            "rate_limited",
            "Wait a moment before requesting another code.",
          );
        }
      }

      const emailSent = await sendVerification(user.id, user.email);
      if (!emailSent) {
        throw new AuthError(
          503,
          "email_unavailable",
          "We could not send the verification email. Try again in a moment.",
        );
      }
      return { emailSent: true, alreadyVerified: false };
    },

    async requestPasswordReset({ email, ip }) {
      await enforceLimit(
        "forgot_password_ip",
        ip || "unknown",
        FORGOT_PASSWORD_IP_LIMIT,
        FORGOT_PASSWORD_IP_WINDOW_MS,
        "Too many password reset requests. Try again later.",
      );

      const normalized = normalizeEmail(email);
      if (!normalized) {
        await createSessionToken();
        return { message: FORGOT_PASSWORD_MESSAGE };
      }

      await enforceLimit(
        "forgot_password",
        normalized,
        FORGOT_PASSWORD_LIMIT,
        FORGOT_PASSWORD_WINDOW_MS,
        "Too many password reset requests. Try again later.",
      );

      const user = await repos.users.findByEmail(normalized);
      if (!user) {
        await createSessionToken();
        return { message: FORGOT_PASSWORD_MESSAGE };
      }

      const now = clock.now();
      const nowIso = toIso(now);
      const { token, tokenHash } = await createSessionToken();
      await repos.passwordResets.consumeAllForUser(user.id, nowIso);
      await repos.passwordResets.create({
        id: createId(),
        userId: user.id,
        tokenHash,
        expiresAt: toIso(addMs(now, PASSWORD_RESET_TTL_MS)),
        consumedAt: null,
        createdAt: nowIso,
      });

      const resetUrl = `${publicBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;
      try {
        await emailSender.send(passwordResetEmail(user.email, resetUrl));
      } catch (error) {
        if (error instanceof EmailDeliveryError) {
          console.error("email_delivery_failed", error.message);
        } else {
          throw error;
        }
      }

      return { message: FORGOT_PASSWORD_MESSAGE };
    },

    async resetPassword({ token, password, ip }) {
      await enforceLimit(
        "reset_password",
        ip || "unknown",
        RESET_PASSWORD_LIMIT,
        RESET_PASSWORD_WINDOW_MS,
        "Too many password reset attempts. Try again later.",
      );

      const rawToken = normalizeResetToken(token);
      const invalid = new AuthError(400, "invalid_reset_token", INVALID_RESET_MESSAGE);
      if (!rawToken) {
        await hashPassword(typeof password === "string" ? password : "placeholder");
        throw invalid;
      }

      const now = clock.now();
      const nowIso = toIso(now);
      const tokenHash = await hashToken(rawToken);
      const challenge = await repos.passwordResets.findActiveByTokenHash(
        tokenHash,
        nowIso,
      );

      if (!challenge) {
        await hashPassword(typeof password === "string" ? password : "placeholder");
        throw invalid;
      }

      const user = await repos.users.findById(challenge.userId);
      if (!user) {
        await repos.passwordResets.consume(challenge.id, nowIso);
        throw invalid;
      }

      const passwordError = validatePassword(password, user.email);
      if (passwordError) {
        throw new AuthError(400, "invalid_password", passwordError);
      }

      await repos.users.updatePassword(user.id, await hashPassword(password), nowIso);
      await repos.passwordResets.consumeAllForUser(user.id, nowIso);
      await repos.sessions.deleteByUserId(user.id);

      try {
        await emailSender.send(passwordResetConfirmationEmail(user.email));
      } catch (error) {
        if (error instanceof EmailDeliveryError) {
          console.error("email_delivery_failed", error.message);
        } else {
          throw error;
        }
      }

      return { ok: true as const };
    },
  };
}
