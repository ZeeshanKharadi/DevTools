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
| `organize-pdf` | `/tools/organize-pdf` | `infyratools-organized.pdf` |
| `watermark-pdf` | `/tools/watermark-pdf` | `infyratools-watermarked.pdf` |
| `sign-pdf` | `/tools/sign-pdf` | `infyratools-signed.pdf` |

All PDF tools are free for anonymous visitors. Existing Pro entitlements and `PRO_BETA_ACCESS` are unchanged.

## Architecture

- Shared helpers: `lib/tools/pdf-shared/` (`operations`, `organize`, `watermark`, `sign`, `pdfjs`, `utils`)
- Shared UI: `components/pdf/`
- Tool UIs: `components/{merge-pdf,split-pdf,jpg-to-pdf,pdf-to-jpg,rotate-pdf,organize-pdf,watermark-pdf,sign-pdf}/`
- Registry category: `pdf`
- SEO content: `content/tools/*-pdf.ts` and related files
- PDF.js worker served from `public/pdf.worker.min.mjs` (copied from `pdfjs-dist@6.4.299`; keep hashes in sync after upgrades)
- `pdfjs-dist` is loaded with a dynamic client-side import to avoid Node/SSR evaluation during static export

## Dependencies

- `pdf-lib` — merge, split/extract, rotate, organize, watermark, sign, images→PDF
- `pdfjs-dist` — page previews and PDF→JPG rendering
- `jszip` — multi-file ZIP downloads

## Privacy

Uploaded PDF/image/signature bytes stay in memory for the current session. Reset clears signatures. No server upload path is used.

## Known limitations

- Password-protected / encrypted PDFs are rejected until unlocked.
- Very large files may hit browser memory limits; previews load in batches.
- PDF→JPG produces raster images (text is not selectable).
- Sign PDF adds a visible electronic signature only—not certificate-based digital signing.
- Typed signatures use system/local font stacks (no external font CDN).
- After upgrading `pdfjs-dist`, run `npm run pdf:sync-worker` so `public/pdf.worker.min.mjs` matches.

## Testing

```bash
npx vitest run lib/tools/pdf-shared
npm run typecheck
npm run lint
npm test
npm run build
```

## Future Pro ideas (not implemented)

- Saved page-range and watermark presets
- Account-stored signature profiles
- Multi-job batch queues for signed-in users
