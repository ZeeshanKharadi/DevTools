# Image tools (browser-local)

InfyraTools image tools process files entirely in the browser using Canvas / `createImageBitmap`. They do not call Cloudflare Workers or store images in D1.

## Tools

| Slug | Route | Notes |
|---|---|---|
| `image-compressor` | `/tools/image-compressor` | JPG / PNG / WebP; batch ZIP |
| `image-resizer` | `/tools/image-resizer` | Exact pixels, %, presets; contain / cover / stretch |

## Architecture

- Shared helpers: `lib/tools/image-shared/`
- Shared dropzone: `components/image/ImageFileDropzone.tsx`
- Tool UIs: `components/{image-compressor,image-resizer}/`
- Registry category: `images`

## Format behavior

- **JPEG / WebP:** quality slider uses canvas encoding quality.
- **PNG:** canvas PNG export is lossless; the UI does not pretend a JPEG-style quality control applies. Savings mainly come from dimension reduction.
- **WebP:** encoding requires browser support; unsupported browsers get a clear error.

## Privacy

Images stay in memory for the session. Object URLs and bitmaps are released on remove/reset.

## Future Pro ideas (not implemented)

- Saved resize/compress presets per account
- Batch workflow history for signed-in users
