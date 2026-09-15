import { FONT_STACKS } from "../../../lib/tools/digital-business-card/constants";
import { prepareCard } from "../../../lib/tools/digital-business-card/prepare";
import type { CardInput } from "../../../lib/tools/digital-business-card/types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PUBLIC_HTML_CSP =
  "default-src 'none'; img-src https:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-ancestors 'none'";

function hasControlChars(value: string): boolean {
  return /[\u0000-\u001F\u007F]/.test(value);
}

function safeHref(raw: string | null): string | null {
  if (!raw || hasControlChars(raw)) {
    return null;
  }

  try {
    const url = new URL(raw);
    if (
      url.protocol === "https:" ||
      url.protocol === "http:" ||
      url.protocol === "mailto:" ||
      url.protocol === "tel:"
    ) {
      return raw;
    }
  } catch {
    return null;
  }

  return null;
}

function safeImage(raw: string | null): string | null {
  if (!raw || hasControlChars(raw)) {
    return null;
  }

  try {
    const url = new URL(raw);
    if (url.protocol === "https:") {
      return raw;
    }
  } catch {
    return null;
  }

  return null;
}

function textPage(title: string, message: string, status: number): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: #f6f3ec; color: #1b1914; }
    main { max-width: 32rem; margin: 4rem auto; padding: 0 1.25rem; }
    p { color: #5e594f; }
  </style>
</head>
<body>
  <main>
    <p>InfyraTools</p>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
  </main>
</body>
</html>`;

  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "content-security-policy": PUBLIC_HTML_CSP,
    },
  });
}

export function cardUnavailableResponse(): Response {
  return textPage(
    "Card not available",
    "This business card is inactive or does not exist.",
    404,
  );
}

export function qrMissingResponse(): Response {
  return textPage(
    "QR code not found",
    "This InfyraTools QR code does not exist.",
    404,
  );
}

export function qrInactiveResponse(): Response {
  return textPage(
    "QR code inactive",
    "This InfyraTools QR code is turned off.",
    410,
  );
}

export function renderPublicCardHtml(input: CardInput, publicUrl?: string): string {
  const card = prepareCard(input);
  const font = FONT_STACKS[card.font] ?? FONT_STACKS.sans;
  const name = card.fullName || "Business card";
  const photo = card.showPhoto ? safeImage(card.photoSrc) : null;
  const logo = card.showLogo ? safeImage(card.logoSrc) : null;
  const website = safeHref(card.websiteHref);
  const email = safeHref(card.emailHref);
  const phone = safeHref(card.phoneHref);
  const description = [card.jobTitle, card.company, card.bio]
    .filter(Boolean)
    .join(" · ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  const socials = card.showSocial
    ? card.socials
        .map((social) => {
          const href = safeHref(social.href);
          if (!href) {
            return "";
          }
          return `<a href="${escapeHtml(href)}" rel="noopener noreferrer">${escapeHtml(social.label)}</a>`;
        })
        .filter(Boolean)
        .join(" · ")
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>${escapeHtml(name)} · InfyraTools</title>
  ${description ? `<meta name="description" content="${escapeHtml(description)}">` : ""}
  ${publicUrl ? `<link rel="canonical" href="${escapeHtml(publicUrl)}">` : ""}
  ${publicUrl ? `<meta property="og:url" content="${escapeHtml(publicUrl)}">` : ""}
  <meta property="og:title" content="${escapeHtml(name)}">
  ${description ? `<meta property="og:description" content="${escapeHtml(description)}">` : ""}
  ${photo ? `<meta property="og:image" content="${escapeHtml(photo)}">` : ""}
  <style>
    body { margin: 0; font-family: ${font}; background: #efebe3; color: ${escapeHtml(card.textColor)}; }
    main { min-height: 100vh; display: grid; place-items: center; padding: 2rem 1rem; }
    .card { width: min(36rem, 100%); background: ${escapeHtml(card.backgroundColor)}; border: 1px solid #d9d3c7; border-radius: 1.25rem; padding: 1.75rem; box-shadow: 0 10px 30px rgba(27,25,20,.08); }
    .accent { height: 6px; background: ${escapeHtml(card.accentColor)}; border-radius: 999px; margin-bottom: 1.25rem; }
    h1 { margin: 0 0 .35rem; font-size: 1.75rem; }
    .meta, .row, .bio { margin: 0 0 .4rem; }
    .meta, .bio { opacity: .8; }
    .links a { color: ${escapeHtml(card.accentColor)}; }
    img.photo { width: 5.5rem; height: 5.5rem; object-fit: cover; border-radius: 999px; }
    img.logo { max-height: 2.25rem; max-width: 8rem; }
    .brand { margin-top: 1.25rem; font-size: .75rem; opacity: .55; }
  </style>
</head>
<body>
  <main>
    <article class="card">
      <div class="accent"></div>
      ${photo ? `<p><img class="photo" alt="" src="${escapeHtml(photo)}"></p>` : ""}
      ${logo ? `<p><img class="logo" alt="" src="${escapeHtml(logo)}"></p>` : ""}
      <h1>${escapeHtml(name)}</h1>
      <p class="meta">${escapeHtml([card.jobTitle, card.company].filter(Boolean).join(" · "))}</p>
      ${card.phone ? `<p class="row">${phone ? `<a href="${escapeHtml(phone)}">${escapeHtml(card.phone)}</a>` : escapeHtml(card.phone)}</p>` : ""}
      ${card.email ? `<p class="row">${email ? `<a href="${escapeHtml(email)}">${escapeHtml(card.email)}</a>` : escapeHtml(card.email)}</p>` : ""}
      ${card.website && website ? `<p class="row"><a href="${escapeHtml(website)}" rel="noopener noreferrer">${escapeHtml(card.website.replace(/^https?:\/\//, ""))}</a></p>` : ""}
      ${card.address ? `<p class="row">${escapeHtml(card.address)}</p>` : ""}
      ${card.bio ? `<p class="bio">${escapeHtml(card.bio)}</p>` : ""}
      ${socials ? `<p class="links">${socials}</p>` : ""}
      <p class="brand">Hosted by InfyraTools</p>
    </article>
  </main>
</body>
</html>`;
}

export function publicCardResponse(input: CardInput, publicUrl?: string): Response {
  return new Response(renderPublicCardHtml(input, publicUrl), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "content-security-policy": PUBLIC_HTML_CSP,
    },
  });
}
