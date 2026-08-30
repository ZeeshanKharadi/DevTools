# Project Plan — Developer Tools Website (V1)

## Status

The repository is empty. This is a greenfield Next.js application.

No existing code, dependencies, or product decisions are in place.

**This document is a plan only. Implementation starts only after approval.**

---

## Goal

Build a professional, fast, privacy-focused website of free online developer tools.

V1 ships ten tools. All of them process data in the browser. There is no backend, no database, no accounts, and no analytics.

The first implementation milestone is not “all ten tools.” It is **JSON Formatter**, implemented well enough that every later tool follows the same pattern.

---

## What V1 includes

- Homepage (`/`)
- Tools index (`/tools`)
- Ten tool pages (see `TOOL_REGISTRY.md`)
- Light / dark / system theme
- Shared tool page layout
- SEO metadata, sitemap, robots, breadcrumbs, FAQ schema
- Client-side-only processing for every tool
- Production build that succeeds

## What V1 does not include

- PDF tools, file converters, image tools, AI tools, calculators
- Accounts, payments, subscriptions
- Backend API, database, queues, workers
- Analytics
- User-input persistence (localStorage for tool input is out of scope unless later requested)
- Third-party scripts that receive tool input

---

## Implementation phases

### Phase 0 — Planning (this step)

Deliverables:

- `PROJECT_PLAN.md` (this file)
- `ARCHITECTURE.md`
- `TOOL_REGISTRY.md`

**Stop here and wait for approval.**

### Phase 1 — Foundation

Create the Next.js app and the shared shell only. No tool logic yet beyond a placeholder for JSON Formatter.

- Next.js (App Router) + TypeScript + Tailwind CSS
- Root layout, fonts, global styles
- Theme (light / dark / system)
- Header, footer, breadcrumbs
- Homepage (hero, search, popular tools, categories, all tools, FAQ)
- `/tools` index
- Tool page shell (`ToolPage`)
- Shared UI: buttons, textarea, copy / clear / paste / download
- Tool registry + SEO helpers
- `sitemap.ts` and `robots.ts`
- Empty states, error message component, success toast/feedback

Acceptance:

- `npm run build` succeeds
- Homepage and `/tools` render
- Theme toggle works
- Tool page shell renders for `/tools/json-formatter` with SEO content and a disabled/empty workspace

**Stop and wait for approval before Phase 2.**

### Phase 2 — JSON Formatter (first real tool)

Implement the full JSON Formatter against the Definition of Done.

- Format, minify, validate
- Copy, clear, paste, download
- Error messages with location (line / column)
- Keyboard shortcuts
- How to use, examples, FAQ, related tools
- Unit tests for parse / format / minify / error location
- Mobile + dark mode + accessibility pass
- Production build succeeds

**Stop and wait for approval before the next tool.**

### Phase 3 — Remaining tools, one at a time

Implement in this order. After each tool: build, test, review, fix, then wait for approval.

1. JSON Validator
2. JWT Decoder
3. Base64 Encoder / Decoder
4. URL Encoder / Decoder
5. UUID Generator
6. Unix Timestamp Converter
7. Regex Tester
8. SQL Formatter
9. Cron Expression Generator

Each tool reuses the Phase 1 shell and follows the JSON Formatter pattern.

---

## Definition of Done (every tool)

A tool is complete only when:

- It works correctly on desktop and mobile
- It works in light and dark mode
- Errors are human-readable (never raw stack traces)
- Copy and clear/reset work where applicable
- It is keyboard-accessible and labeled for screen readers
- Processing is local; user input is never sent to a server
- SEO metadata, H1, explanatory content, FAQ, and related tools are present
- Tool-specific code is not loaded on unrelated pages
- Tests cover the core logic where appropriate
- `npm run build` succeeds

---

## Dependencies (planned)

Keep the dependency list short.

| Package | Why |
| --- | --- |
| `next`, `react`, `react-dom` | App framework |
| `typescript` | Typing |
| `tailwindcss` | Styling |
| `sql-formatter` | SQL Formatter only; dynamically imported on that page |

No JWT library. No UUID library (`crypto.randomUUID`). No regex library. No state-management library. No analytics SDK.

Theme can be a small custom provider (class on `<html>` + `localStorage` + system preference). `next-themes` is optional and only if the custom version becomes messy.

`cronstrue` is **not** planned for V1. Cron explanation will be a small local function covering the fields we generate.

---

## Risks and constraints

| Risk | Mitigation |
| --- | --- |
| Large JSON freezes the UI | Format in the client with size guidance; avoid naive recursive pretty-print on huge trees; show a clear warning above a threshold |
| Invalid regex / catastrophic backtracking | Catch compile errors; run matches with a timeout/abort strategy; never let an exception unmount the app |
| XSS via user text | Never use `dangerouslySetInnerHTML` for user input; render as text |
| SQL “universal” claims | Document supported dialects from `sql-formatter` only |
| JWT misunderstood as verification | Persistent, visible warning: decode ≠ verify |

---

## Success for this milestone

Approval of this plan, `ARCHITECTURE.md`, and `TOOL_REGISTRY.md`.

After approval, Phase 1 (foundation) begins. JSON Formatter is the first tool, not the first commit of the whole product.
