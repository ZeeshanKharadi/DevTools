import { DEFAULT_OPTIONS, EMPTY_FIELDS, EMPTY_IMAGE } from "./constants";
import { sanitizeColor, sanitizeHttpUrl, trimField } from "./sanitize";
import {
  EMAIL_SAFE_FONTS,
  FONT_SIZES,
  SIGNATURE_TEMPLATES,
  type SignatureFields,
  type SignatureImage,
  type SignatureInput,
  type SignatureOptions,
} from "./types";

const MAX_FIELD = 200;
const MAX_URL = 500;

function cap(value: unknown, max: number): string {
  if (typeof value !== "string") {
    return "";
  }

  return trimField(value).slice(0, max);
}

function storedImage(raw: unknown): { image: SignatureImage; strippedLocal: boolean } {
  if (!raw || typeof raw !== "object") {
    return { image: EMPTY_IMAGE, strippedLocal: false };
  }

  const record = raw as { origin?: unknown; url?: unknown };
  const origin = record.origin;
  const url = typeof record.url === "string" ? record.url.trim() : "";

  if (origin === "hosted") {
    const hosted = sanitizeHttpUrl(url.slice(0, MAX_URL));
    if (hosted) {
      return { image: { origin: "hosted", url: hosted }, strippedLocal: false };
    }

    return { image: EMPTY_IMAGE, strippedLocal: false };
  }

  if (origin === "local" && url.startsWith("data:image/")) {
    return { image: EMPTY_IMAGE, strippedLocal: true };
  }

  return { image: EMPTY_IMAGE, strippedLocal: false };
}

function isTemplate(
  value: unknown,
): value is SignatureInput["options"]["template"] {
  return (
    typeof value === "string" &&
    (SIGNATURE_TEMPLATES as readonly string[]).includes(value)
  );
}

function isFont(value: unknown): value is SignatureInput["options"]["fontFamily"] {
  return typeof value === "string" && (EMAIL_SAFE_FONTS as readonly string[]).includes(value);
}

function isFontSize(
  value: unknown,
): value is SignatureInput["options"]["fontSize"] {
  return typeof value === "string" && (FONT_SIZES as readonly string[]).includes(value);
}

export function parseStoredSignatureInput(raw: unknown): {
  ok: true;
  data: SignatureInput;
  warnings: string[];
} | { ok: false; message: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "Signature data must be an object." };
  }

  const record = raw as {
    fields?: unknown;
    photo?: unknown;
    logo?: unknown;
    options?: unknown;
  };

  if (!record.fields || typeof record.fields !== "object") {
    return { ok: false, message: "Signature fields are required." };
  }

  const fieldsRaw = record.fields as Record<string, unknown>;
  const fields: SignatureFields = { ...EMPTY_FIELDS };

  for (const key of Object.keys(EMPTY_FIELDS) as (keyof SignatureFields)[]) {
    fields[key] = cap(fieldsRaw[key], MAX_FIELD);
  }

  const photo = storedImage(record.photo);
  const logo = storedImage(record.logo);
  const optionsRaw =
    record.options && typeof record.options === "object"
      ? (record.options as Record<string, unknown>)
      : {};

  const options: SignatureOptions = {
    template: isTemplate(optionsRaw.template)
      ? optionsRaw.template
      : DEFAULT_OPTIONS.template,
    accentColor: sanitizeColor(
      typeof optionsRaw.accentColor === "string" ? optionsRaw.accentColor : "",
      DEFAULT_OPTIONS.accentColor,
    ),
    textColor: sanitizeColor(
      typeof optionsRaw.textColor === "string" ? optionsRaw.textColor : "",
      DEFAULT_OPTIONS.textColor,
    ),
    fontFamily: isFont(optionsRaw.fontFamily)
      ? optionsRaw.fontFamily
      : DEFAULT_OPTIONS.fontFamily,
    fontSize: isFontSize(optionsRaw.fontSize)
      ? optionsRaw.fontSize
      : DEFAULT_OPTIONS.fontSize,
    showPhoto: optionsRaw.showPhoto !== false,
    showLogo: optionsRaw.showLogo !== false,
    showSocial: optionsRaw.showSocial !== false,
    showDivider: optionsRaw.showDivider !== false,
  };

  const warnings: string[] = [];
  if (photo.strippedLocal || logo.strippedLocal) {
    warnings.push(
      "Local images were not saved. Use a hosted https:// image URL so the signature can be reopened later.",
    );
  }

  return {
    ok: true,
    data: {
      fields,
      photo: photo.image,
      logo: logo.image,
      options,
    },
    warnings,
  };
}

export function parseSignatureName(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  const name = trimField(raw).slice(0, 80);
  return name.length > 0 ? name : null;
}
