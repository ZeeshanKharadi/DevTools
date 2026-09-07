export const SIGNATURE_TEMPLATES = [
  "minimal",
  "corporate",
  "modern",
  "compact",
  "executive",
] as const;

export type SignatureTemplateId = (typeof SIGNATURE_TEMPLATES)[number];

export const EMAIL_SAFE_FONTS = [
  "arial",
  "helvetica",
  "georgia",
  "times",
  "tahoma",
  "verdana",
  "trebuchet",
  "courier",
] as const;

export type EmailSafeFont = (typeof EMAIL_SAFE_FONTS)[number];

export const FONT_SIZES = ["small", "medium", "large"] as const;

export type SignatureFontSize = (typeof FONT_SIZES)[number];

export const SOCIAL_NETWORKS = [
  "linkedin",
  "x",
  "facebook",
  "instagram",
  "github",
] as const;

export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export type ImageOrigin = "none" | "local" | "hosted";

export type SignatureImage = {
  origin: ImageOrigin;
  url: string;
};

export type SignatureFields = {
  fullName: string;
  jobTitle: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  linkedin: string;
  x: string;
  facebook: string;
  instagram: string;
  github: string;
};

export type SignatureOptions = {
  template: SignatureTemplateId;
  accentColor: string;
  textColor: string;
  fontFamily: EmailSafeFont;
  fontSize: SignatureFontSize;
  showPhoto: boolean;
  showLogo: boolean;
  showSocial: boolean;
  showDivider: boolean;
};

export type SignatureInput = {
  fields: SignatureFields;
  photo: SignatureImage;
  logo: SignatureImage;
  options: SignatureOptions;
};

export type SanitizedSocial = {
  id: SocialNetwork;
  label: string;
  href: string;
};

export type SanitizedSignature = {
  fullName: string | null;
  jobTitle: string | null;
  company: string | null;
  email: string | null;
  emailHref: string | null;
  phone: string | null;
  phoneHref: string | null;
  website: string | null;
  websiteHref: string | null;
  websiteLabel: string | null;
  address: string | null;
  photoSrc: string | null;
  logoSrc: string | null;
  photoIsLocal: boolean;
  logoIsLocal: boolean;
  socials: SanitizedSocial[];
  accentColor: string;
  textColor: string;
  mutedColor: string;
  fontFamily: string;
  fontSize: number;
  smallSize: number;
  showPhoto: boolean;
  showLogo: boolean;
  showSocial: boolean;
  showDivider: boolean;
  template: SignatureTemplateId;
};

export type SignatureRenderResult = {
  html: string;
  plainText: string;
  document: string;
  warnings: string[];
};
