# Phase 3A — InfyraTools Pro foundation

InfyraTools stays a **static Next.js export** on Cloudflare Pages. Accounts and Pro products run on a **separate Cloudflare Worker** with **D1**. Free tools do not require login and still run only in the browser.

See `docs/PRO_MVP.md` for hosted cards, dynamic QR, invoices, customers, entitlement, and public Worker routes.

## Architecture

```
Browser (static Pages site)
  ├── Free tools (unchanged, no account)
  └── /login /register /dashboard
           │  JSON + HttpOnly cookie
           ▼
Cloudflare Worker  /api/*  /card/:slug  /q/:code
           │
           ▼
Service layer  →  repository interface  →  D1 implementation
```

A memory repository is used in unit tests so the same services can later target PostgreSQL without rewriting auth or signature rules.

## Local setup

1. Install dependencies: `npm install`
2. Copy `worker/.dev.vars.example` to `worker/.dev.vars`
3. Apply D1 migrations locally:

```bash
npm run d1:migrate:local
```

4. Start the Worker:

```bash
npm run worker:dev
```

5. In `.env.local` (not committed):

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787
```

6. Start the static site: `npm run dev`

Use `http://localhost:3000` (not `127.0.0.1`) so CORS and cookies match `APP_ORIGIN`.

## Cloudflare setup

1. Create D1: `npm run d1:create`  
   Put the returned `database_id` in `worker/wrangler.toml`.
2. Apply remote migrations: `npm run d1:migrate:remote`
3. Set Worker vars (dashboard or `wrangler.toml` production env):
   - `APP_ORIGIN=https://infyratools.com`
   - `COOKIE_SECURE=true`
   - `COOKIE_SAMESITE=lax`
4. Route the Worker to **`infyratools.com/api/*`** on the same zone as Pages.
5. Production site build must **omit** `NEXT_PUBLIC_API_BASE_URL` (or leave it empty) so the browser calls same-origin `/api`.
6. Deploy Worker: `npm run worker:deploy`  
   Pages deploy stays the existing static `out/` pipeline.

No production secrets are required for sessions: the cookie holds an opaque random token; D1 stores only the SHA-256 hash of that token.

## Authentication and sessions

- Register / login / logout / `GET /api/auth/me`
- Passwords hashed with **Web Crypto PBKDF2-HMAC-SHA256** (100,000 iterations, unique random salt). Cloudflare production Web Crypto and `node:crypto` reject PBKDF2 above 100,000 iterations (`NotSupportedError`). The stored string is `pbkdf2-hmac-sha256$1$<iterations>$<salt>$<hash>`. Verification uses the work factor stored with that hash. Hashes are never returned in API responses. This still requires Workers Paid (Free is 10 ms CPU).
- Session cookie `infyratools_session`: **HttpOnly**, **SameSite=Lax** (production), **Secure** in production, 14-day expiry.
- Session lookups require `expires_at > now` in the database query. The service layer also rejects expired sessions on every authenticated request. Expired rows for that identifier may be deleted when encountered. There is no scheduled session cleanup in this phase.
- Current user is taken from the session, never from a client-supplied `user_id`.
- Mutating requests with an `Origin` header must match `APP_ORIGIN`. JSON `Content-Type` is required (CSRF reduction with Lax cookies).
- Login: 10 attempts / 15 minutes / IP. Register: 5 / hour / IP.
- Login failures use the same message whether or not the email exists.

## D1 foreign keys

Cloudflare D1 **enforces foreign keys by default**. The migration declares them explicitly:

- `sessions.user_id` → `users.id` **ON DELETE CASCADE**
- `email_signatures.user_id` → `users.id` **ON DELETE CASCADE**

That matches the intended account-deletion model: removing a user removes that user’s sessions and saved signatures. Application-layer ownership checks still run on every signature read/write. Foreign keys are not authorization.


## Saved signatures

`email_signatures.signature_data` is JSON matching the existing `SignatureInput` model. HTML is regenerated in the browser. Local `data:` images are **not** stored (hosted `https://` URLs are). Ownership is enforced on every read/write; other users receive **404**.

## Bindings

| Binding / var | Purpose |
|---|---|
| `DB` (D1) | users, sessions, email_signatures, auth_attempts, plus Pro MVP tables in `0002_pro_mvp.sql` |
| `APP_ORIGIN` | Allowed CORS / Origin list (comma-separated if needed) |
| `PUBLIC_BASE_URL` | Origin used in hosted card and dynamic QR public URLs |
| `COOKIE_SECURE` | `true` in production |
| `COOKIE_SAMESITE` | `lax` in production; `none` only if API is on another site |

Never commit `worker/.dev.vars`, `.env.local`, or D1 dumps with user data.

## Dashboard protection

`/dashboard` is statically exported like the rest of the site. It redirects to `/login` in the browser when there is no session. Saved signature data is never embedded in that HTML; it is loaded from authenticated APIs that enforce ownership.
