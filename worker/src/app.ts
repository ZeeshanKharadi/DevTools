import type { Clock } from "./clock";
import { systemClock } from "./clock";
import type { Repositories } from "./db/repositories";
import {
  createUnconfiguredEmailSender,
  type EmailSender,
} from "./email";
import {
  SESSION_TTL_MS,
  AuthError,
  createAuthService,
} from "./services/auth-service";
import {
  SignatureError,
  createSignatureService,
} from "./services/signature-service";
import { createCardService } from "./services/card-service";
import { createQrService } from "./services/qr-service";
import { createInvoiceService } from "./services/invoice-service";
import { createCustomerService } from "./services/customer-service";
import { createProfileService } from "./services/profile-service";
import { createDashboardService } from "./services/dashboard-service";
import { createEntitlementService } from "./services/entitlement";
import {
  cardUnavailableResponse,
  publicCardResponse,
  qrInactiveResponse,
  qrMissingResponse,
} from "./public/card-html";
import { parsePublicCode, parseSlug } from "./ids";
import {
  SESSION_COOKIE,
  HttpError,
  clearSessionCookie,
  clientIp,
  json,
  jsonError,
  readCookie,
  readJson,
  sessionCookie,
} from "./http";

export type AppConfig = {
  allowedOrigins: string[];
  cookieSecure: boolean;
  cookieSameSite: "Lax" | "None";
  publicBaseUrl: string;
};

export type AppDeps = {
  repos: Repositories;
  clock?: Clock;
  config: AppConfig;
  email?: EmailSender;
};

function corsHeaders(request: Request, config: AppConfig): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!origin) {
    return {};
  }

  if (!config.allowedOrigins.includes(origin)) {
    return {};
  }

  return {
    "access-control-allow-origin": origin,
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    vary: "Origin",
  };
}

function mutatingOriginAllowed(request: Request, config: AppConfig): boolean {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
    return true;
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  return config.allowedOrigins.includes(origin);
}

function cookieOptions(config: AppConfig) {
  return {
    maxAge: SESSION_TTL_MS,
    secure: config.cookieSecure,
    sameSite: config.cookieSameSite,
  };
}

function withCors(response: Response, request: Request, config: AppConfig): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(request, config))) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

function matchPath(pathname: string, pattern: string): Record<string, string> | null {
  const pathParts = pathname.split("/").filter(Boolean);
  const patternParts = pattern.split("/").filter(Boolean);
  if (pathParts.length !== patternParts.length) {
    return null;
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const part = patternParts[i];
    if (part.startsWith(":")) {
      try {
        params[part.slice(1)] = decodeURIComponent(pathParts[i]);
      } catch {
        return null;
      }
    } else if (part !== pathParts[i]) {
      return null;
    }
  }

  return params;
}

export function createApp(deps: AppDeps) {
  const clock = deps.clock ?? systemClock;
  const entitlements = createEntitlementService();
  const auth = createAuthService(
    deps.repos,
    clock,
    deps.email ?? createUnconfiguredEmailSender(),
  );
  const signatures = createSignatureService(deps.repos, clock, entitlements);
  const cards = createCardService(
    deps.repos,
    clock,
    entitlements,
    deps.config.publicBaseUrl,
  );
  const qrCodes = createQrService(
    deps.repos,
    clock,
    entitlements,
    deps.config.publicBaseUrl,
  );
  const invoices = createInvoiceService(deps.repos, clock, entitlements);
  const customers = createCustomerService(deps.repos, clock, entitlements);
  const profiles = createProfileService(deps.repos, clock, entitlements);
  const dashboard = createDashboardService(deps.repos);
  const { config } = deps;

  async function route(request: Request, url: URL): Promise<Response> {
    const { pathname } = url;
    const token = readCookie(request, SESSION_COOKIE);
    const ip = clientIp(request);

    if (pathname.startsWith("/card/") && request.method === "GET") {
      const publicCard = matchPath(pathname, "/card/:slug");
      const slug = publicCard ? parseSlug(publicCard.slug) : null;
      if (!slug) {
        return cardUnavailableResponse();
      }
      const card = await cards.getPublicBySlug(slug);
      return card
        ? publicCardResponse(card.data, card.publicUrl)
        : cardUnavailableResponse();
    }

    if (pathname.startsWith("/q/") && request.method === "GET") {
      const publicQr = matchPath(pathname, "/q/:code");
      const code = publicQr ? parsePublicCode(publicQr.code) : null;
      if (!code) {
        return qrMissingResponse();
      }
      const result = await qrCodes.resolveRedirect(code);
      if (result.status === "redirect") {
        return new Response(null, {
          status: 302,
          headers: {
            location: result.url,
            "cache-control": "no-store",
          },
        });
      }
      return result.status === "inactive" ? qrInactiveResponse() : qrMissingResponse();
    }

    if (request.method === "POST" && pathname === "/api/auth/register") {
      const body = (await readJson(request)) as { email?: string; password?: string };
      const result = await auth.register({
        email: String(body.email ?? ""),
        password: String(body.password ?? ""),
        ip,
      });
      return json(
        { user: result.user, emailSent: result.emailSent },
        201,
        { "set-cookie": sessionCookie(result.token, cookieOptions(config)) },
      );
    }

    if (request.method === "POST" && pathname === "/api/auth/login") {
      const body = (await readJson(request)) as { email?: string; password?: string };
      const result = await auth.login({
        email: String(body.email ?? ""),
        password: String(body.password ?? ""),
        ip,
      });
      return json(
        { user: result.user },
        200,
        { "set-cookie": sessionCookie(result.token, cookieOptions(config)) },
      );
    }

    if (request.method === "POST" && pathname === "/api/auth/logout") {
      await auth.logout(token);
      return json(
        { ok: true },
        200,
        { "set-cookie": clearSessionCookie(cookieOptions(config)) },
      );
    }

    if (request.method === "GET" && pathname === "/api/auth/me") {
      const user = await auth.me(token);
      return json({ user });
    }

    if (request.method === "POST" && pathname === "/api/auth/verify-email") {
      const body = (await readJson(request)) as { code?: unknown };
      const user = await auth.verifyEmail({ token, code: body.code, ip });
      return json({ user });
    }

    if (request.method === "POST" && pathname === "/api/auth/resend-verification") {
      const result = await auth.resendVerification({ token, ip });
      return json({ ok: true, ...result });
    }

    if (request.method === "GET" && pathname === "/api/dashboard/summary") {
      const user = await auth.requireVerified(token);
      return json({ summary: await dashboard.summary(user.id) });
    }

    if (request.method === "GET" && pathname === "/api/account/profile") {
      const user = await auth.requireVerified(token);
      return json({ profile: await profiles.get(user.id) });
    }

    if (request.method === "PUT" && pathname === "/api/account/profile") {
      const user = await auth.requireVerified(token);
      const body = (await readJson(request)) as Record<string, unknown>;
      return json({ profile: await profiles.update(user.id, body) });
    }

    if (request.method === "GET" && pathname === "/api/signatures") {
      const user = await auth.requireVerified(token);
      return json({ signatures: await signatures.list(user.id) });
    }

    if (request.method === "POST" && pathname === "/api/signatures") {
      const user = await auth.requireVerified(token);
      const body = (await readJson(request)) as { name?: unknown; data?: unknown };
      const created = await signatures.create(user.id, {
        name: body.name,
        data: body.data,
      });
      return json({ signature: created }, 201);
    }

    const signatureDuplicate = matchPath(pathname, "/api/signatures/:id/duplicate");
    if (signatureDuplicate && request.method === "POST") {
      const user = await auth.requireVerified(token);
      const created = await signatures.duplicate(user.id, signatureDuplicate.id);
      return json({ signature: created }, 201);
    }

    const signatureOne = matchPath(pathname, "/api/signatures/:id");
    if (signatureOne) {
      const user = await auth.requireVerified(token);
      const { id } = signatureOne;

      if (request.method === "GET") {
        return json({ signature: await signatures.get(user.id, id) });
      }

      if (request.method === "PUT") {
        const body = (await readJson(request)) as { name?: unknown; data?: unknown };
        return json({ signature: await signatures.update(user.id, id, body) });
      }

      if (request.method === "DELETE") {
        await signatures.delete(user.id, id);
        return json({ ok: true });
      }
    }

    if (request.method === "GET" && pathname === "/api/cards") {
      const user = await auth.requireVerified(token);
      return json({ cards: await cards.list(user.id) });
    }

    if (request.method === "POST" && pathname === "/api/cards") {
      const user = await auth.requireVerified(token);
      const body = (await readJson(request)) as Record<string, unknown>;
      return json({ card: await cards.create(user.id, body) }, 201);
    }

    const cardDuplicate = matchPath(pathname, "/api/cards/:id/duplicate");
    if (cardDuplicate && request.method === "POST") {
      const user = await auth.requireVerified(token);
      return json({ card: await cards.duplicate(user.id, cardDuplicate.id) }, 201);
    }

    const cardOne = matchPath(pathname, "/api/cards/:id");
    if (cardOne) {
      const user = await auth.requireVerified(token);
      if (request.method === "GET") {
        return json({ card: await cards.get(user.id, cardOne.id) });
      }
      if (request.method === "PUT") {
        const body = (await readJson(request)) as Record<string, unknown>;
        return json({ card: await cards.update(user.id, cardOne.id, body) });
      }
      if (request.method === "DELETE") {
        await cards.delete(user.id, cardOne.id);
        return json({ ok: true });
      }
    }

    if (request.method === "GET" && pathname === "/api/qr") {
      const user = await auth.requireVerified(token);
      return json({ qrCodes: await qrCodes.list(user.id) });
    }

    if (request.method === "POST" && pathname === "/api/qr") {
      const user = await auth.requireVerified(token);
      const body = (await readJson(request)) as Record<string, unknown>;
      return json({ qrCode: await qrCodes.create(user.id, body) }, 201);
    }

    const qrDuplicate = matchPath(pathname, "/api/qr/:id/duplicate");
    if (qrDuplicate && request.method === "POST") {
      const user = await auth.requireVerified(token);
      return json({ qrCode: await qrCodes.duplicate(user.id, qrDuplicate.id) }, 201);
    }

    const qrOne = matchPath(pathname, "/api/qr/:id");
    if (qrOne) {
      const user = await auth.requireVerified(token);
      if (request.method === "GET") {
        return json({ qrCode: await qrCodes.get(user.id, qrOne.id) });
      }
      if (request.method === "PUT") {
        const body = (await readJson(request)) as Record<string, unknown>;
        return json({ qrCode: await qrCodes.update(user.id, qrOne.id, body) });
      }
      if (request.method === "DELETE") {
        await qrCodes.delete(user.id, qrOne.id);
        return json({ ok: true });
      }
    }

    if (request.method === "GET" && pathname === "/api/invoices") {
      const user = await auth.requireVerified(token);
      return json({
        invoices: await invoices.list(user.id, url.searchParams.get("q") ?? undefined),
      });
    }

    if (request.method === "POST" && pathname === "/api/invoices") {
      const user = await auth.requireVerified(token);
      const body = (await readJson(request)) as Record<string, unknown>;
      return json({ invoice: await invoices.create(user.id, body) }, 201);
    }

    const invoiceDuplicate = matchPath(pathname, "/api/invoices/:id/duplicate");
    if (invoiceDuplicate && request.method === "POST") {
      const user = await auth.requireVerified(token);
      return json(
        { invoice: await invoices.duplicate(user.id, invoiceDuplicate.id) },
        201,
      );
    }

    const invoiceOne = matchPath(pathname, "/api/invoices/:id");
    if (invoiceOne) {
      const user = await auth.requireVerified(token);
      if (request.method === "GET") {
        return json({ invoice: await invoices.get(user.id, invoiceOne.id) });
      }
      if (request.method === "PUT") {
        const body = (await readJson(request)) as Record<string, unknown>;
        return json({ invoice: await invoices.update(user.id, invoiceOne.id, body) });
      }
      if (request.method === "DELETE") {
        await invoices.delete(user.id, invoiceOne.id);
        return json({ ok: true });
      }
    }

    if (request.method === "GET" && pathname === "/api/customers") {
      const user = await auth.requireVerified(token);
      return json({ customers: await customers.list(user.id) });
    }

    if (request.method === "POST" && pathname === "/api/customers") {
      const user = await auth.requireVerified(token);
      const body = (await readJson(request)) as Record<string, unknown>;
      return json({ customer: await customers.create(user.id, body) }, 201);
    }

    const customerOne = matchPath(pathname, "/api/customers/:id");
    if (customerOne) {
      const user = await auth.requireVerified(token);
      if (request.method === "GET") {
        return json({ customer: await customers.get(user.id, customerOne.id) });
      }
      if (request.method === "PUT") {
        const body = (await readJson(request)) as Record<string, unknown>;
        return json({
          customer: await customers.update(user.id, customerOne.id, body),
        });
      }
      if (request.method === "DELETE") {
        await customers.delete(user.id, customerOne.id);
        return json({ ok: true });
      }
    }

    return jsonError(404, "not_found", "Not found.");
  }

  return {
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url);

      if (request.method === "OPTIONS") {
        return withCors(new Response(null, { status: 204 }), request, config);
      }

      if (!mutatingOriginAllowed(request, config)) {
        return withCors(
          jsonError(403, "forbidden_origin", "This origin is not allowed."),
          request,
          config,
        );
      }

      try {
        const response = await route(request, url);
        return withCors(response, request, config);
      } catch (error) {
        if (
          error instanceof AuthError ||
          error instanceof SignatureError ||
          error instanceof HttpError
        ) {
          return withCors(
            jsonError(error.status, error.code, error.message),
            request,
            config,
          );
        }

        if (error instanceof Error && error.message === "UNSUPPORTED_TYPE") {
          return withCors(
            jsonError(415, "unsupported_type", "Send JSON with Content-Type application/json."),
            request,
            config,
          );
        }

        if (error instanceof Error && error.message === "INVALID_JSON") {
          return withCors(
            jsonError(400, "invalid_json", "Request body must be valid JSON."),
            request,
            config,
          );
        }

        return withCors(
          jsonError(500, "server_error", "Something went wrong."),
          request,
          config,
        );
      }
    },
  };
}
