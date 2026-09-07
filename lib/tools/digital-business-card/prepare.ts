import {
  DEFAULT_ACCENT,
  DEFAULT_BACKGROUND,
  DEFAULT_TEXT,
  MAX_BIO,
  SOCIAL_LABELS,
  isCardFont,
  isCardTemplate,
} from "./constants";
import {
  sanitizeColor,
  sanitizeDataImageUrl,
  sanitizeEmail,
  sanitizeHttpUrl,
  sanitizePhone,
  stripControlChars,
  telDigits,
  trimField,
} from "@/lib/tools/qr-code-generator";
import { CARD_SOCIALS } from "./types";
import type { CardInput, CardSocialId, PreparedCard, PreparedSocial } from "./types";

export function splitName(fullName: string): { given: string; family: string } {
  const parts = trimField(fullName).split(" ").filter(Boolean);
  if (parts.length === 0) {
    return { given: "", family: "" };
  }
  if (parts.length === 1) {
    return { given: parts[0], family: "" };
  }
  return {
    given: parts.slice(0, -1).join(" "),
    family: parts[parts.length - 1],
  };
}

function socialHref(id: CardSocialId, raw: string): string | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }
  return sanitizeHttpUrl(value);
}

export function prepareCard(input: CardInput): PreparedCard {
  const warnings: string[] = [];
  const name = trimField(input.fields.fullName);
  const { given, family } = splitName(name);
  const emailRaw = input.fields.email.trim();
  const email = emailRaw ? sanitizeEmail(emailRaw) : null;
  if (emailRaw && !email) {
    warnings.push("Email was omitted because it is not a valid address.");
  }
  const phoneRaw = input.fields.phone.trim();
  const phone = phoneRaw ? sanitizePhone(phoneRaw) : null;
  if (phoneRaw && !phone) {
    warnings.push("Phone was omitted because it is not a valid number.");
  }
  const websiteRaw = input.fields.website.trim();
  const website = websiteRaw ? sanitizeHttpUrl(websiteRaw) : null;
  if (websiteRaw && !website) {
    warnings.push("Website was omitted. Use an http or https URL.");
  }

  const socials: PreparedSocial[] = [];
  if (input.options.showSocial) {
    for (const id of CARD_SOCIALS) {
      const href = socialHref(id, input.fields[id]);
      if (input.fields[id].trim() && !href) {
        warnings.push(`${SOCIAL_LABELS[id]} link was omitted. Use an http or https URL.`);
      }
      if (href) {
        socials.push({ id, label: SOCIAL_LABELS[id], href });
      }
    }
  }

  const photo = input.photoDataUrl
    ? sanitizeDataImageUrl(input.photoDataUrl)
    : null;
  const logo = input.logoDataUrl
    ? sanitizeDataImageUrl(input.logoDataUrl)
    : null;
  if (input.photoDataUrl && !photo) {
    warnings.push("Profile photo was omitted. Use a PNG, JPEG, GIF, or WebP image.");
  }
  if (input.logoDataUrl && !logo) {
    warnings.push("Logo was omitted. Use a PNG, JPEG, GIF, or WebP image.");
  }

  let bio = stripControlChars(input.fields.bio).trim();
  if (bio.length > MAX_BIO) {
    bio = bio.slice(0, MAX_BIO);
    warnings.push(`Bio was trimmed to ${MAX_BIO} characters.`);
  }

  return {
    fullName: name || null,
    givenName: given,
    familyName: family,
    jobTitle: trimField(input.fields.jobTitle) || null,
    company: trimField(input.fields.company) || null,
    phone,
    phoneHref: phone ? `tel:${telDigits(phone)}` : null,
    email,
    emailHref: email ? `mailto:${email}` : null,
    website,
    websiteHref: website,
    address: trimField(input.fields.address) || null,
    bio: bio || null,
    photoSrc: photo,
    logoSrc: logo,
    socials,
    accentColor: sanitizeColor(input.options.accentColor, DEFAULT_ACCENT),
    backgroundColor: sanitizeColor(input.options.backgroundColor, DEFAULT_BACKGROUND),
    textColor: sanitizeColor(input.options.textColor, DEFAULT_TEXT),
    font: isCardFont(input.options.font) ? input.options.font : "sans",
    template: isCardTemplate(input.options.template)
      ? input.options.template
      : "corporate",
    showPhoto: input.options.showPhoto,
    showLogo: input.options.showLogo,
    showQr: input.options.showQr,
    showSocial: input.options.showSocial,
    warnings,
  };
}
