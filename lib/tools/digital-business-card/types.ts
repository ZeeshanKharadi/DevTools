/**
 * V1 cards are generated locally. They are not hosted at a public URL.
 *
 * Future Pro/server features must not be imported here: hosted cards,
 * custom URLs such as infyratools.com/card/username, analytics, multiple
 * cards, premium templates, NFC sharing, and team/company cards.
 */
export const CARD_GENERATION_MODE = "local" as const;

export const CARD_PRO_FEATURES = [
  "hosted-cards",
  "custom-urls",
  "card-analytics",
  "multiple-cards",
  "premium-templates",
  "nfc-sharing",
  "team-cards",
] as const;

export type CardProFeature = (typeof CARD_PRO_FEATURES)[number];

export const CARD_TEMPLATES = ["minimal", "corporate", "bold", "compact"] as const;
export type CardTemplateId = (typeof CARD_TEMPLATES)[number];

export const CARD_FONTS = ["sans", "serif", "mono"] as const;
export type CardFont = (typeof CARD_FONTS)[number];

export const CARD_SOCIALS = [
  "linkedin",
  "x",
  "facebook",
  "instagram",
  "github",
  "other",
] as const;

export type CardSocialId = (typeof CARD_SOCIALS)[number];

export type CardFields = {
  fullName: string;
  jobTitle: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  bio: string;
  linkedin: string;
  x: string;
  facebook: string;
  instagram: string;
  github: string;
  other: string;
};

export type CardOptions = {
  template: CardTemplateId;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  font: CardFont;
  showPhoto: boolean;
  showLogo: boolean;
  showQr: boolean;
  showSocial: boolean;
};

export type CardInput = {
  fields: CardFields;
  photoDataUrl: string | null;
  logoDataUrl: string | null;
  options: CardOptions;
};

export type PreparedSocial = {
  id: CardSocialId;
  label: string;
  href: string;
};

export type PreparedCard = {
  fullName: string | null;
  givenName: string;
  familyName: string;
  jobTitle: string | null;
  company: string | null;
  phone: string | null;
  phoneHref: string | null;
  email: string | null;
  emailHref: string | null;
  website: string | null;
  websiteHref: string | null;
  address: string | null;
  bio: string | null;
  photoSrc: string | null;
  logoSrc: string | null;
  socials: PreparedSocial[];
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  font: CardFont;
  template: CardTemplateId;
  showPhoto: boolean;
  showLogo: boolean;
  showQr: boolean;
  showSocial: boolean;
  warnings: string[];
};
