import {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_MUTED_COLOR,
  DEFAULT_TEXT_COLOR,
  FONT_SIZE_PX,
  FONT_STACKS,
  SOCIAL_LABELS,
} from "./constants";
import {
  displayHost,
  mailtoHref,
  present,
  sanitizeColor,
  sanitizeEmail,
  sanitizeHttpUrl,
  sanitizeImageSrc,
  sanitizePhone,
  telHref,
  trimField,
} from "./sanitize";
import type {
  SanitizedSignature,
  SanitizedSocial,
  SignatureImage,
  SignatureInput,
  SocialNetwork,
} from "./types";

function socialHref(
  id: SocialNetwork,
  raw: string,
): SanitizedSocial | null {
  const href = sanitizeHttpUrl(raw);

  if (!href) {
    return null;
  }

  return { id, label: SOCIAL_LABELS[id], href };
}

function resolveImage(
  image: SignatureImage,
  visible: boolean,
): { src: string | null; local: boolean } {
  if (!visible || image.origin === "none") {
    return { src: null, local: false };
  }

  const src = sanitizeImageSrc(image.url);

  if (!src) {
    return { src: null, local: false };
  }

  return {
    src,
    local: image.origin === "local" || src.startsWith("data:image/"),
  };
}

export function prepareSignature(input: SignatureInput): SanitizedSignature {
  const email = sanitizeEmail(input.fields.email);
  const phone = sanitizePhone(input.fields.phone);
  const websiteHref = sanitizeHttpUrl(input.fields.website);
  const photo = resolveImage(input.photo, input.options.showPhoto);
  const logo = resolveImage(input.logo, input.options.showLogo);
  const socials = (
    [
      socialHref("linkedin", input.fields.linkedin),
      socialHref("x", input.fields.x),
      socialHref("facebook", input.fields.facebook),
      socialHref("instagram", input.fields.instagram),
      socialHref("github", input.fields.github),
    ] as const
  ).filter((item): item is SanitizedSocial => item !== null);

  const fontSize = FONT_SIZE_PX[input.options.fontSize];

  return {
    fullName: present(trimField(input.fields.fullName))
      ? trimField(input.fields.fullName)
      : null,
    jobTitle: present(trimField(input.fields.jobTitle))
      ? trimField(input.fields.jobTitle)
      : null,
    company: present(trimField(input.fields.company))
      ? trimField(input.fields.company)
      : null,
    email,
    emailHref: email ? mailtoHref(email) : null,
    phone,
    phoneHref: phone ? telHref(phone) : null,
    website: websiteHref,
    websiteHref,
    websiteLabel: websiteHref ? displayHost(websiteHref) : null,
    address: present(trimField(input.fields.address))
      ? trimField(input.fields.address)
      : null,
    photoSrc: photo.src,
    logoSrc: logo.src,
    photoIsLocal: photo.local,
    logoIsLocal: logo.local,
    socials: input.options.showSocial ? socials : [],
    accentColor: sanitizeColor(input.options.accentColor, DEFAULT_ACCENT_COLOR),
    textColor: sanitizeColor(input.options.textColor, DEFAULT_TEXT_COLOR),
    mutedColor: DEFAULT_MUTED_COLOR,
    fontFamily: FONT_STACKS[input.options.fontFamily] ?? FONT_STACKS.arial,
    fontSize,
    smallSize: Math.max(11, fontSize - 2),
    showPhoto: Boolean(photo.src),
    showLogo: Boolean(logo.src),
    showSocial: input.options.showSocial && socials.length > 0,
    showDivider: input.options.showDivider,
    template: input.options.template,
  };
}
