import { DEFAULT_OPTIONS, EMPTY_FIELDS, MAX_BIO } from "./constants";
import { sanitizeColor, sanitizeHttpUrl, trimField } from "../qr-code-generator/sanitize";
import {
  CARD_FONTS,
  CARD_TEMPLATES,
  type CardFields,
  type CardInput,
  type CardOptions,
} from "./types";

const MAX_FIELD = 200;

function cap(value: unknown, max: number): string {
  if (typeof value !== "string") {
    return "";
  }
  return trimField(value).slice(0, max);
}

function hostedOrNone(raw: unknown): { url: string | null; strippedLocal: boolean } {
  if (typeof raw !== "string" || !raw.trim()) {
    return { url: null, strippedLocal: false };
  }

  const value = raw.trim();
  if (value.startsWith("data:image/")) {
    return { url: null, strippedLocal: true };
  }

  return { url: sanitizeHttpUrl(value.slice(0, 500)), strippedLocal: false };
}

export function parseStoredCardInput(raw: unknown):
  | { ok: true; data: CardInput; warnings: string[] }
  | { ok: false; message: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "Card data must be an object." };
  }

  const record = raw as {
    fields?: unknown;
    photoDataUrl?: unknown;
    logoDataUrl?: unknown;
    options?: unknown;
  };

  if (!record.fields || typeof record.fields !== "object") {
    return { ok: false, message: "Card fields are required." };
  }

  const fieldsRaw = record.fields as Record<string, unknown>;
  const fields: CardFields = { ...EMPTY_FIELDS };
  for (const key of Object.keys(EMPTY_FIELDS) as (keyof CardFields)[]) {
    fields[key] = cap(fieldsRaw[key], key === "bio" ? MAX_BIO : MAX_FIELD);
  }

  const photo = hostedOrNone(record.photoDataUrl);
  const logo = hostedOrNone(record.logoDataUrl);
  const optionsRaw =
    record.options && typeof record.options === "object"
      ? (record.options as Record<string, unknown>)
      : {};

  const template =
    typeof optionsRaw.template === "string" &&
    (CARD_TEMPLATES as readonly string[]).includes(optionsRaw.template)
      ? (optionsRaw.template as CardInput["options"]["template"])
      : DEFAULT_OPTIONS.template;
  const font =
    typeof optionsRaw.font === "string" &&
    (CARD_FONTS as readonly string[]).includes(optionsRaw.font)
      ? (optionsRaw.font as CardInput["options"]["font"])
      : DEFAULT_OPTIONS.font;

  const options: CardOptions = {
    template,
    accentColor: sanitizeColor(
      typeof optionsRaw.accentColor === "string" ? optionsRaw.accentColor : "",
      DEFAULT_OPTIONS.accentColor,
    ),
    backgroundColor: sanitizeColor(
      typeof optionsRaw.backgroundColor === "string" ? optionsRaw.backgroundColor : "",
      DEFAULT_OPTIONS.backgroundColor,
    ),
    textColor: sanitizeColor(
      typeof optionsRaw.textColor === "string" ? optionsRaw.textColor : "",
      DEFAULT_OPTIONS.textColor,
    ),
    font,
    showPhoto: optionsRaw.showPhoto !== false,
    showLogo: optionsRaw.showLogo !== false,
    showQr: optionsRaw.showQr !== false,
    showSocial: optionsRaw.showSocial !== false,
  };

  const warnings: string[] = [];
  if (photo.strippedLocal || logo.strippedLocal) {
    warnings.push(
      "Local images were not saved. Use a hosted https:// image URL so the public card can show a photo or logo.",
    );
  }

  return {
    ok: true,
    data: {
      fields,
      photoDataUrl: photo.url,
      logoDataUrl: logo.url,
      options,
    },
    warnings,
  };
}
