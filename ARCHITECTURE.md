# Architecture — Developer Tools Website (V1)

## Principles

1. **Browser-first.** Every V1 tool runs entirely on the client. No API routes for tool processing.
2. **Static where possible.** Pages are statically generated. The interactive tool is a client island.
3. **Registry-driven.** Tools are data + a client component. Adding a tool does not require a new routing convention.
4. **Shared shell, unique workspace.** Layout, SEO, how-to, examples, FAQ, and related tools are shared. The editor/controls differ per tool.
5. **Load only what you need.** Tool logic and heavy libraries load on that tool’s page only.
6. **Do not over-engineer.** Local `useState`. No global store. No backend. No plugin framework.

---

## Stack

- **Next.js App Router** (latest stable)
- **TypeScript** (strict)
- **React**
- **Tailwind CSS**
- **No database, no auth, no server processing**

Rendering model:

- Server Components for layout, metadata, and SEO content
- Client Components only for interactive tool UIs and theme toggle
- `generateStaticParams` for all tool URLs
- `generateMetadata` from the tool registry

---

## Folder structure

```
/
├── PROJECT_PLAN.md
├── ARCHITECTURE.md
├── TOOL_REGISTRY.md
├── app/
│   ├── layout.tsx                 # html/body, theme script, header/footer
│   ├── page.tsx                   # homepage
│   ├── globals.css
│   ├── not-found.tsx
│   ├── robots.ts
│   ├── sitemap.ts
│   └── tools/
│       ├── page.tsx               # all tools
│       └── [slug]/
│           └── page.tsx           # static tool page (SEO + client island)
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── Breadcrumbs.tsx
│   ├── home/
│   │   ├── Hero.tsx
│   │   ├── ToolSearch.tsx
│   │   ├── ToolGrid.tsx
│   │   ├── CategoryList.tsx
│   │   ├── PlatformIntro.tsx
│   │   └── HomeFAQ.tsx
│   ├── tools/
│   │   ├── ToolPage.tsx           # shared page structure
│   │   ├── ToolWorkspace.tsx      # input / actions / output chrome
│   │   ├── RelatedTools.tsx
│   │   ├── HowToUse.tsx
│   │   ├── Examples.tsx
│   │   └── ToolFAQ.tsx
│   ├── json-formatter/            # first tool UI (others added later)
│   │   └── JsonFormatterTool.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Textarea.tsx
│       ├── CopyButton.tsx
│       ├── ClearButton.tsx
│       ├── PasteButton.tsx
│       ├── DownloadButton.tsx
│       └── Feedback.tsx           # errors, empty, success
├── lib/
│   ├── tools/
│   │   ├── types.ts
│   │   ├── registry.ts            # all tool metadata
│   │   └── json-formatter/
│   │       └── format.ts          # pure functions + tests
│   ├── seo.ts
│   ├── theme.ts
│   └── cn.ts                      # className helper
├── content/
│   └── tools/
│       └── json-formatter.ts      # how-to, examples, FAQ copy
└── public/
```

Names can shift slightly during implementation. The boundaries should not:

- `lib/tools/*` — pure logic, testable, no React
- `content/tools/*` — SEO / educational copy
- `components/*` — UI
- `app/*` — routes only

---

## Routing

| URL | Source |
| --- | --- |
| `/` | `app/page.tsx` |
| `/tools` | `app/tools/page.tsx` |
| `/tools/[slug]` | `app/tools/[slug]/page.tsx` |

Canonical slugs (V1):

- `json-formatter`
- `json-validator`
- `jwt-decoder`
- `base64`
- `url-encoder`
- `uuid-generator`
- `unix-timestamp`
- `regex-tester`
- `sql-formatter`
- `cron-generator`

Unknown slugs → `not-found`.

Individual folders per tool (`app/tools/json-formatter/page.tsx`) are **not** used. One `[slug]` route plus the registry keeps URLs identical and avoids ten near-duplicate page files.

---

## Component architecture

```
RootLayout (server)
  ThemeInit (inline script, no flash)
  Header (client: nav + theme + search affordance)
  {children}
  Footer (server)

Homepage (server)
  Hero
  ToolSearch (client: filters registry in memory)
  Popular tools / categories / all tools (from registry)
  Platform intro + FAQ

Tool page (server)
  generateMetadata(tool)
  Breadcrumbs
  ToolPage
    H1 + short description
    Client tool island (dynamic import)
    How to use
    Examples
    FAQ
    Related tools
```

Shared tool chrome (`ToolWorkspace`) provides:

- Labeled input and output regions
- Action row (format / encode / generate, etc.)
- Copy, clear, paste, download, swap where the tool opts in
- Accessible error and empty states

Each tool passes its own controls and results into that chrome. Cron and UUID will look different inside the same page frame.

---

## Tool architecture

A tool is four pieces:

1. **Registry entry** — slug, name, description, category, keywords, related slugs, Open Graph text
2. **Content module** — how-to, examples, FAQ (used for HTML and JSON-LD)
3. **Logic module** — pure TypeScript functions
4. **Client component** — wired to the logic; `'use client'`

Adding a tool later:

1. Add the registry entry
2. Add `content/tools/<slug>.ts`
3. Add `lib/tools/<slug>/*.ts` (+ tests)
4. Add `components/<slug>/<Name>Tool.tsx`
5. Map slug → component in a single client loader

No new route file. No new layout.

### Client-side processing

| Tool | Where it runs | Notes |
| --- | --- | --- |
| JSON Formatter | Browser | `JSON.parse` / `JSON.stringify` |
| JSON Validator | Browser | Same parser; structured errors |
| JWT Decoder | Browser | Split + base64url decode; **no verify** |
| Base64 | Browser | `TextEncoder` / `TextDecoder` |
| URL Encoder | Browser | `encodeURIComponent` / `decodeURIComponent` |
| UUID Generator | Browser | `crypto.randomUUID` |
| Unix Timestamp | Browser | `Date` |
| Regex Tester | Browser | `RegExp` with safe compile + match limits |
| SQL Formatter | Browser | Dynamic `import('sql-formatter')` on that page only |
| Cron Generator | Browser | Local expression builder + explainer |

There are **no** Route Handlers or Server Actions for these tools.

### State management

- Per-tool React state (`useState` / `useMemo` / `useCallback`)
- Theme: React context + `localStorage` + `prefers-color-scheme`
- Homepage search: local state over the in-memory registry
- No Redux, Zustand, URL-persisted tool input, or input caching in V1

---

## SEO strategy

Every tool page:

- Unique `<title>` and meta description from the registry
- Canonical URL (`https://<domain>/tools/<slug>`)
- Open Graph title, description, type `website`
- Single H1 (tool name)
- H2 sections: How to use, Examples, FAQ, Related tools
- Breadcrumbs (visible + `BreadcrumbList` JSON-LD)
- FAQPage JSON-LD from the same FAQ content
- Internal links: related tools, category, `/tools`, homepage

Site-wide:

- `app/sitemap.ts` — `/`, `/tools`, every tool
- `app/robots.ts`
- Homepage and `/tools` also get unique titles/descriptions

Copy must answer search intent (what the tool does, how to use it, limitations). No thin pages.

Domain is TBD. Metadata will use a configurable site URL (env `NEXT_PUBLIC_SITE_URL`) so canonicals are correct when the domain is chosen.

---

## Performance

- Static generation for all marketing and tool pages
- Dynamic `import()` for each tool client component
- `sql-formatter` imported only inside the SQL tool
- No global editor or syntax-highlighter package in V1 (native `<textarea>` unless a tool later proves it needs more)
- Minimal client JS on the homepage (search + theme only)
- System fonts or one self-hosted family; no animation libraries
- Images: none required for V1 tools

---

## Accessibility

- Semantic landmarks (`header`, `main`, `nav`, `footer`)
- Labels on every input; errors linked with `aria-describedby` / `aria-invalid`
- Visible focus rings
- Keyboard: Tab through controls; documented shortcuts (e.g. format) that do not steal browser defaults without a modifier
- Copy/success announced politely (`aria-live="polite"`)
- Color contrast for light and dark themes

---

## Security

- No secrets
- No storage of tool input on a server
- No `dangerouslySetInnerHTML` for user content
- Output is always text (or downloadable text files)
- JWT page states clearly that the signature is not verified
- Regex errors are caught; runaway patterns are time-bounded or rejected
- Production errors are generic; stack traces stay in the console in development only

---

## Testing

- Unit tests for pure logic (`lib/tools/**`) — Vitest, colocated or `__tests__`
- JSON Formatter first: valid/invalid JSON, minify, error line/column
- No E2E suite in Phase 1–2 unless a bug requires it
- Manual pass: mobile width, dark mode, keyboard, production build

---

## Out of scope for the architecture

- Multi-tenant config, feature flags, CMS
- Worker threads / WASM (revisit only if large-JSON performance demands it)
- PWA / offline cache of previous inputs
- i18n

---

## Phase 3A (accounts)

The public site remains `output: "export"`. Authentication and saved email signatures live in `worker/` (Cloudflare Worker + D1). See `docs/PHASE_3A.md`.
