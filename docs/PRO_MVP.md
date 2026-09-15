# InfyraTools Pro MVP (local)

This phase adds account products on top of the Phase 3A Worker + D1 foundation. The public site remains a **static Next.js export**. Free tools still work without login.

## Architecture

```
Browser (static Pages site)
  ├── 14 free tools (unchanged anonymous behavior)
  └── /login /register /dashboard/*
           │  JSON + HttpOnly cookie
           ▼
Cloudflare Worker
  ├── /api/*          authenticated REST
  ├── /card/:slug     public hosted card HTML
  └── /q/:code        dynamic QR redirect
           │
           ▼
Service layer  →  repository interfaces  →  D1
           │
           └── EntitlementService.canUseFeature(userId, feature)
```

`output: "export"` is unchanged. Public `/card/<slug>` and `/q/<code>` cannot be Next.js dynamic routes, so the Worker renders or redirects them.

## Public routing

| URL | Handler | Notes |
|---|---|---|
| `/dashboard`, `/dashboard/signatures`, `/dashboard/cards`, `/dashboard/qr`, `/dashboard/invoices`, `/dashboard/customers`, `/dashboard/account` | Static Next pages | Client-side auth redirect to `/login` |
| `/card/<slug>` | Worker HTML | Active cards only. Text is escaped. No user HTML. https images only. Title/description/canonical come from the saved card; pages are `noindex, nofollow` because this is user-generated content on the tools domain. |
| `/q/<code>` | Worker redirect | Active: **302** to destination. Inactive: **410**. Missing: **404**. |
| `/api/*` | Worker JSON | Same Phase 3A cookie/session model |

Local public base URL is `PUBLIC_BASE_URL` (default `http://localhost:8787`). Production must later use `https://infyratools.com` and attach Worker routes for `/api/*`, `/card/*`, and `/q/*`.

## Database (migration `0002_pro_mvp.sql`)

Added:

- `business_cards` — unique `public_slug`, `is_active`, JSON `card_data`
- `dynamic_qr_codes` — unique `code`, destination, `is_active`, `total_scans`, `last_scanned_at`. **`total_scans` / `last_scanned_at` are the dashboard counters** (incremented with `total_scans = total_scans + 1`).
- `qr_scan_events` — optional per-scan analytics (`id`, `qr_code_id`, `scanned_at`; no IP, geo, or device data). Event insert is best-effort and **must not block a valid redirect**. Counts may therefore be slightly ahead of event rows.
- `customers`
- `invoices` — JSON `invoice_data` plus `invoice_number`, `status`, `currency`
- `business_profiles` — one optional row per user

Existing `users`, `sessions`, `email_signatures`, `auth_attempts` are unchanged. Foreign keys use **ON DELETE CASCADE**. Ownership is still enforced in services; a client-supplied `user_id` is ignored.

## Products

### Email signatures

Reuse `SignatureInput` and the existing generator. Logged-in users save/rename/edit/duplicate/delete, preview, copy, and download from `/dashboard/signatures`. Anonymous copy/download is unchanged.

### Hosted business cards

Reuse `CardInput` / `prepareCard`. Anonymous local generator remains. Logged-in users publish `/card/<slug>`. Local `data:` images are stripped on save; hosted `https://` URLs are kept. No custom domains. No R2. Concurrent auto-generated slugs retry instead of returning 409; a user-chosen slug that is already taken still returns 409.

### Dynamic QR

Does **not** replace the free static QR generator. The QR payload is `{PUBLIC_BASE_URL}/q/{code}`. Updating `destination_url` does not change `code`. Destinations must be http(s); `javascript:`, `data:`, `file:`, and control characters are rejected. Redirect responses re-validate the stored URL before setting `Location`.

### Invoices and customers

Reuse `InvoiceInput`. PDFs are generated in the browser, not stored. Statuses: `draft`, `sent`, `paid`, `cancelled`. No payment collection, email sending, or recurring invoices. Customers are a simple per-user directory.

### Business profile

Optional `PUT /api/account/profile`. Tool-specific fields still work independently.

## Entitlement architecture

`EntitlementService.canUseFeature(userId, feature)` is the only product gate.

During beta it returns **true for any authenticated user**. Product services call `requireFeature` on mutating operations. There is no Stripe, Paddle, or subscription table. Later billing should implement this interface rather than adding payment checks inside cards/QR/invoices.

Features: `signatures`, `cards`, `dynamic_qr`, `invoices`, `customers`, `profile`.

## File / image hosting

D1 does not store image blobs. Local data URLs are stripped when saving cards, signatures, and invoices. Public cards may show `https://` images only. Hosted images are **not** required for the MVP.

**R2 is required later** only if InfyraTools hosts first-party uploads. Current limitations that R2 would remove:

- Business-card photo and logo files cannot be stored; users must paste an already-hosted `https://` image URL (or omit the image).
- Invoice and signature logos/photos have the same constraint.
- Dynamic QR images are generated in the browser from the short URL; they are not stored as objects.

Until R2 exists, do not make hosted images mandatory.

## Production Cloudflare (do not enable in this phase)

Later, when deploying:

1. Workers **Paid** (PBKDF2 600,000 iterations will not fit Workers Free 10 ms CPU)
2. Production D1 + apply migrations `0001` and `0002`
3. Worker routes: `infyratools.com/api/*`, `/card/*`, `/q/*`
4. `APP_ORIGIN=https://infyratools.com`
5. `PUBLIC_BASE_URL=https://infyratools.com`
6. `COOKIE_SECURE=true`
7. Pages build **omit** `NEXT_PUBLIC_API_BASE_URL`
8. Future: R2 for uploads, then billing/provider behind `EntitlementService`

Do not create those production resources until this local MVP is reviewed.

## Local development

Same as Phase 3A, plus `PUBLIC_BASE_URL=http://localhost:8787` in `worker/.dev.vars`.

```
npm run d1:migrate:local
npm run worker:dev
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787 npm run dev
```

Use `http://localhost:3000` (not `127.0.0.1`). Public card and QR URLs are on port **8787** locally.
