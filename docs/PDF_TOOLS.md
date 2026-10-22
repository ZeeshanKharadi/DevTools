# PDF tools (browser-local)

InfyraTools PDF tools process files entirely in the browser. They do not call the Cloudflare Worker and do not store documents in D1.

## Tools

| Slug | Route | Output |
|---|---|---|
| `merge-pdf` | `/tools/merge-pdf` | `infyratools-merged.pdf` |
| `split-pdf` | `/tools/split-pdf` | `infyratools-extracted.pdf` or `infyratools-split-pages.zip` |
| `jpg-to-pdf` | `/tools/jpg-to-pdf` | `infyratools-images.pdf` |
| `pdf-to-jpg` | `/tools/pdf-to-jpg` | `infyratools-page-N.jpg` or `infyratools-pdf-images.zip` |
| `rotate-pdf` | `/tools/rotate-pdf` | `infyratools-rotated.pdf` |

All five tools are free for anonymous visitors. Existing Pro entitlements and `PRO_BETA_ACCESS` are unchanged.

## Architecture

- Shared helpers: `lib/tools/pdf-shared/`
- Shared UI: `components/pdf/`
- Tool UIs: `components/{merge-pdf,split-pdf,jpg-to-pdf,pdf-to-jpg,rotate-pdf}/`
- Registry category: `pdf`
- SEO content: `content/tools/*-pdf.ts` and related files
- PDF.js worker served from `public/pdf.worker.min.mjs` (copied from `pdfjs-dist@6.4.299`; keep hashes in sync after upgrades)
- `pdfjs-dist` is loaded with a dynamic client-side import to avoid Node/SSR evaluation during static export

## Dependencies

- `pdf-lib` — merge, split/extract, rotate, images→PDF
- `pdfjs-dist` — page previews and PDF→JPG rendering
- `jszip` — multi-file ZIP downloads

## Privacy

Uploaded PDF/image bytes stay in memory for the current session. Closing or resetting the tool releases object URLs. No server upload path is used.

## Known limitations

- Password-protected / encrypted PDFs are rejected until unlocked.
- Very large files may hit browser memory limits; previews load in batches.
- PDF→JPG produces raster images (text is not selectable).
- Image→PDF supports JPG/JPEG and PNG.
- After upgrading `pdfjs-dist`, run `npm run pdf:sync-worker` so `public/pdf.worker.min.mjs` matches.

## Testing

```bash
npx vitest run lib/tools/pdf-shared/operations.test.ts
npm run typecheck
npm run lint
npm test
npm run build
```

## Future Pro ideas (not implemented)

- Saved page-range presets
- Multi-job batch queues for signed-in users
- Account-stored processing preferences
