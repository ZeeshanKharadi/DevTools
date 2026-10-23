# Tool Registry — V1

Single catalog of tools. Implementation will mirror this in `lib/tools/registry.ts`.

Site name (working): **DevTools** — final product name can change without changing slugs.

Required registry fields: `slug`, `name`, `title`, `h1`, `description`, `category`, `keywords`, `popular`, `related`, `capabilities`.

`keywords` power intent-based search (name, description, keywords, and category). `popular: true` selects homepage popular tools.

---

## Categories

| ID | Label | Tools |
| --- | --- | --- |
| `data` | Data | JSON Formatter, JSON Validator, JWT Decoder |
| `encoding` | Encoding | Base64, URL Encoder / Decoder |
| `generators` | Generators | UUID Generator, Cron Expression Generator |
| `time` | Time | Unix Timestamp Converter |
| `text` | Text & Query | Regex Tester, SQL Formatter |
| `business` | Business | Email Signature, QR, Invoice, Digital Business Card |
| `pdf` | PDF | Merge PDF, Split PDF, JPG to PDF, PDF to JPG, Rotate PDF, PDF Page Organizer, Add Watermark to PDF, Sign PDF |
| `images` | Images | Image Compressor, Image Resizer |

See also `docs/PDF_TOOLS.md` for PDF processing architecture.


Current popular tools: JSON Formatter, JWT Decoder, Base64, UUID Generator, Regex Tester.

---

## V1 tools

### 1. JSON Formatter

| Field | Value |
| --- | --- |
| Slug | `json-formatter` |
| Path | `/tools/json-formatter` |
| Title | JSON Formatter — Format, Minify & Validate JSON |
| H1 | JSON Formatter |
| Description | Format, minify, and validate JSON in your browser. Nothing is sent to a server. |
| Category | `data` |
| Keywords | `json`, `format`, `formatter`, `pretty`, `pretty-print`, `beautify`, `minify`, `prettify`, `indent` |
| Popular | `true` |
| Related | `json-validator`, `base64`, `jwt-decoder` |
| Capabilities | copy, clear, paste, download |

**Behavior:** Format, minify, validate, copy, clear, paste, download, error location (line/column). Large-input guidance. Local only.

**Status:** First tool to implement (Phase 2). Pattern-setter for all others.

---

### 2. JSON Validator

| Field | Value |
| --- | --- |
| Slug | `json-validator` |
| Path | `/tools/json-validator` |
| Title | JSON Validator — Check JSON Syntax |
| H1 | JSON Validator |
| Description | Validate JSON and see clear error locations. Runs entirely in your browser. |
| Category | `data` |
| Keywords | `json`, `validate`, `validator`, `validation`, `syntax`, `lint`, `check`, `parse` |
| Popular | `false` |
| Related | `json-formatter`, `jwt-decoder` |
| Capabilities | copy, clear |

**Behavior:** Validate, copy, clear, structured errors with location. Shares parse/error helpers with the formatter. Local only.

---

### 3. JWT Decoder

| Field | Value |
| --- | --- |
| Slug | `jwt-decoder` |
| Path | `/tools/jwt-decoder` |
| Title | JWT Decoder — Decode JSON Web Tokens |
| H1 | JWT Decoder |
| Description | Decode a JWT header and payload in your browser. Decoding does not verify the signature. |
| Category | `data` |
| Keywords | `jwt`, `token`, `decode`, `decoder`, `claims`, `json web token`, `bearer`, `header`, `payload` |
| Popular | `true` |
| Related | `json-formatter`, `base64`, `unix-timestamp` |
| Capabilities | copy, clear, paste |

**Behavior:** Decode header and payload; show claims; render `exp` / `iat` as human-readable local and UTC times. Visible warning: **decode ≠ verify**. Never send the token to a server.

---

### 4. Base64 Encoder / Decoder

| Field | Value |
| --- | --- |
| Slug | `base64` |
| Path | `/tools/base64` |
| Title | Base64 Encoder & Decoder |
| H1 | Base64 Encoder / Decoder |
| Description | Encode and decode Base64, including Unicode text, locally in your browser. |
| Category | `encoding` |
| Keywords | `base64`, `encode`, `encoder`, `decode`, `decoder`, `encoding`, `unicode` |
| Popular | `true` |
| Related | `url-encoder`, `jwt-decoder` |
| Capabilities | copy, clear, swap |

**Behavior:** Encode, decode, Unicode-safe, copy, clear, swap input/output. Local only.

---

### 5. URL Encoder / Decoder

| Field | Value |
| --- | --- |
| Slug | `url-encoder` |
| Path | `/tools/url-encoder` |
| Title | URL Encoder & Decoder |
| H1 | URL Encoder / Decoder |
| Description | Encode and decode URL components, including Unicode, in your browser. |
| Category | `encoding` |
| Keywords | `url`, `uri`, `encode`, `encoder`, `decode`, `decoder`, `percent-encoding`, `query string`, `unicode` |
| Popular | `false` |
| Related | `base64`, `json-formatter` |
| Capabilities | copy, clear, swap |

**Behavior:** Encode, decode, Unicode, copy, clear, swap. Uses `encodeURIComponent` / `decodeURIComponent`. Local only.

---

### 6. UUID Generator

| Field | Value |
| --- | --- |
| Slug | `uuid-generator` |
| Path | `/tools/uuid-generator` |
| Title | UUID Generator — Create UUID v4 |
| H1 | UUID Generator |
| Description | Generate UUID v4 identifiers locally with the Web Crypto API. |
| Category | `generators` |
| Keywords | `uuid`, `guid`, `v4`, `generate`, `generator`, `identifier`, `unique id` |
| Popular | `true` |
| Related | `unix-timestamp`, `base64` |
| Capabilities | copy, clear |

**Behavior:** Generate one or many UUID v4 values; copy one; copy all; clear. `crypto.randomUUID()` only. No v1/v5 in V1.

---

### 7. Unix Timestamp Converter

| Field | Value |
| --- | --- |
| Slug | `unix-timestamp` |
| Path | `/tools/unix-timestamp` |
| Title | Unix Timestamp Converter |
| H1 | Unix Timestamp Converter |
| Description | Convert between Unix timestamps and dates. Seconds or milliseconds, local time or UTC. |
| Category | `time` |
| Keywords | `unix`, `timestamp`, `epoch`, `date`, `time`, `milliseconds`, `utc`, `converter` |
| Popular | `false` |
| Related | `jwt-decoder`, `cron-generator` |
| Capabilities | copy, clear |

**Behavior:** Timestamp → date, date → timestamp, seconds/ms, current timestamp, local timezone and UTC. Local only.

---

### 8. Regex Tester

| Field | Value |
| --- | --- |
| Slug | `regex-tester` |
| Path | `/tools/regex-tester` |
| Title | Regex Tester — Test Regular Expressions |
| H1 | Regex Tester |
| Description | Test regular expressions against sample text in your browser. Invalid patterns cannot crash the page. |
| Category | `text` |
| Keywords | `regex`, `regexp`, `regular expression`, `match`, `pattern`, `test`, `tester`, `flags` |
| Popular | `true` |
| Related | `json-formatter`, `url-encoder` |
| Capabilities | copy, clear |

**Behavior:** Pattern, test text, flags, match list, capture groups, common examples. Compile errors shown clearly. Match work is bounded so a bad pattern cannot freeze the tab. Local only.

---

### 9. SQL Formatter

| Field | Value |
| --- | --- |
| Slug | `sql-formatter` |
| Path | `/tools/sql-formatter` |
| Title | SQL Formatter |
| H1 | SQL Formatter |
| Description | Format SQL in your browser. Supported dialects are listed on the page; this is not a universal SQL parser. |
| Category | `text` |
| Keywords | `sql`, `format`, `formatter`, `query`, `pretty`, `beautify`, `dialect` |
| Popular | `false` |
| Related | `json-formatter`, `regex-tester` |
| Capabilities | copy, clear, download |

**Behavior:** Format, copy, clear, download. Dialect selector limited to what `sql-formatter` supports (e.g. sql, mysql, postgresql, tsql, sqlite — exact list confirmed when the package is added). Page copy must not claim universal SQL. Library loaded only on this page.

---

### 10. Cron Expression Generator

| Field | Value |
| --- | --- |
| Slug | `cron-generator` |
| Path | `/tools/cron-generator` |
| Title | Cron Expression Generator |
| H1 | Cron Expression Generator |
| Description | Build a cron expression from minute, hour, day, month, and weekday, with a plain-language explanation. |
| Category | `generators` |
| Keywords | `cron`, `schedule`, `crontab`, `expression`, `job`, `generator` |
| Popular | `false` |
| Related | `unix-timestamp`, `regex-tester` |
| Capabilities | copy, clear |

**Behavior:** Field pickers → 5-field cron string + human-readable explanation. Common examples (every minute, hourly, daily, weekly, weekdays). Standard 5-field cron (not seconds, not Quartz) unless we later document an extra format. Local only.

---

## Shared page contract

Every tool page renders, in order:

1. Breadcrumbs
2. H1 + one-paragraph description
3. Privacy line (“Processed in your browser. Nothing is uploaded.”)
4. Tool workspace
5. How to use
6. Examples
7. FAQ
8. Related tools

Optional workspace actions (tool opts in): copy, clear/reset, paste, download, swap, keyboard shortcuts.

---

## Implementation order

1. JSON Formatter ← stop for approval after this
2. JSON Validator
3. JWT Decoder
4. Base64
5. URL Encoder
6. UUID Generator
7. Unix Timestamp
8. Regex Tester
9. SQL Formatter
10. Cron Generator

After each tool: build, test, review, fix, then wait for approval.

---

## Adding a tool later (after V1)

1. Append a row to this file and to `lib/tools/registry.ts`
2. Add content, logic, client component
3. Register the component in the slug → component map
4. Sitemap picks it up from the registry automatically

No new App Router folder is required.
