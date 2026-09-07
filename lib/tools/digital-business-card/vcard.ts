import {
  EMPTY_FIELDS,
  DEFAULT_STYLE,
  buildQrPayload,
  escapeVCardValue,
  foldVCardLine,
  renderStaticQr,
  sanitizeDataImageUrl,
  telDigits,
  type QrInput,
} from "@/lib/tools/qr-code-generator";
import { MAX_VCF_PHOTO_BYTES } from "./constants";
import { prepareCard } from "./prepare";
import type { CardInput, PreparedCard } from "./types";

function photoPayload(dataUrl: string): { type: string; data: string } | null {
  const clean = sanitizeDataImageUrl(dataUrl);
  if (!clean) {
    return null;
  }
  const match = /^data:image\/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)$/i.exec(
    clean,
  );
  if (!match) {
    return null;
  }
  const data = match[2];
  const padding = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
  const bytes = Math.floor((data.length * 3) / 4) - padding;
  if (bytes > MAX_VCF_PHOTO_BYTES) {
    return null;
  }
  const type = match[1].toLowerCase() === "jpg" ? "JPEG" : match[1].toUpperCase();
  return { type: type === "JPG" ? "JPEG" : type, data };
}

export function buildContactVCard(
  card: PreparedCard,
  photoDataUrl: string | null,
): { ok: true; vcard: string; warnings: string[] } | { ok: false; message: string } {
  if (!card.fullName) {
    return { ok: false, message: "Enter a name to create a vCard." };
  }

  const warnings: string[] = [];
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    foldVCardLine(
      `N:${escapeVCardValue(card.familyName)};${escapeVCardValue(card.givenName)};;;`,
    ),
    foldVCardLine(`FN:${escapeVCardValue(card.fullName)}`),
  ];

  if (card.company) {
    lines.push(foldVCardLine(`ORG:${escapeVCardValue(card.company)}`));
  }
  if (card.jobTitle) {
    lines.push(foldVCardLine(`TITLE:${escapeVCardValue(card.jobTitle)}`));
  }
  if (card.phone) {
    lines.push(
      foldVCardLine(`TEL;TYPE=VOICE:${escapeVCardValue(telDigits(card.phone))}`),
    );
  }
  if (card.email) {
    lines.push(foldVCardLine(`EMAIL;TYPE=INTERNET:${escapeVCardValue(card.email)}`));
  }
  if (card.websiteHref) {
    lines.push(foldVCardLine(`URL:${escapeVCardValue(card.websiteHref)}`));
  }
  if (card.address) {
    lines.push(
      foldVCardLine(`ADR;TYPE=WORK:;;${escapeVCardValue(card.address)};;;;`),
    );
  }
  if (card.bio) {
    lines.push(foldVCardLine(`NOTE:${escapeVCardValue(card.bio)}`));
  }
  for (const social of card.socials) {
    lines.push(
      foldVCardLine(
        `X-SOCIALPROFILE;TYPE=${escapeVCardValue(social.id)}:${escapeVCardValue(social.href)}`,
      ),
    );
  }

  if (photoDataUrl) {
    const photo = photoPayload(photoDataUrl);
    if (photo) {
      lines.push(
        foldVCardLine(`PHOTO;ENCODING=b;TYPE=${photo.type}:${photo.data}`),
      );
    } else {
      warnings.push(
        "The profile photo was left out of the vCard because it is too large or not a raster image. It can still appear on this page.",
      );
    }
  }

  lines.push("END:VCARD");
  return { ok: true, vcard: lines.join("\r\n"), warnings };
}

export function cardToQrInput(input: CardInput): QrInput {
  const prepared = prepareCard(input);
  return {
    type: "vcard",
    fields: {
      ...EMPTY_FIELDS,
      vcardFirstName: prepared.givenName,
      vcardLastName: prepared.familyName,
      vcardOrganization: prepared.company ?? "",
      vcardTitle: prepared.jobTitle ?? "",
      vcardPhone: prepared.phone ?? "",
      vcardEmail: prepared.email ?? "",
      vcardWebsite: prepared.websiteHref ?? "",
      vcardStreet: prepared.address ?? "",
    },
    style: {
      ...DEFAULT_STYLE,
      size: 192,
      margin: 1,
      foreground: prepared.textColor,
      background: prepared.backgroundColor,
      errorCorrection: "M",
    },
    logoDataUrl: null,
  };
}

export function qrPayloadForCard(input: CardInput) {
  const qrInput = cardToQrInput(input);
  return buildQrPayload(qrInput.type, qrInput.fields);
}

export async function renderCardQr(input: CardInput) {
  return renderStaticQr(cardToQrInput(input));
}

export function buildDownloadVCard(input: CardInput) {
  return buildContactVCard(prepareCard(input), input.photoDataUrl);
}

export function contactPlainText(card: PreparedCard): string {
  return [
    card.fullName,
    card.jobTitle,
    card.company,
    card.phone,
    card.email,
    card.websiteHref,
    card.address,
    card.bio,
    ...card.socials.map((social) => `${social.label}: ${social.href}`),
  ]
    .filter(Boolean)
    .join("\n");
}
