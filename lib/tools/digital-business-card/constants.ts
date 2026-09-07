import type { CardFields, CardFont, CardInput, CardOptions, CardSocialId, CardTemplateId } from "./types";
import { CARD_FONTS, CARD_TEMPLATES } from "./types";

export const DEFAULT_ACCENT = "#0f6e56";
export const DEFAULT_BACKGROUND = "#fffdf8";
export const DEFAULT_TEXT = "#1b1914";
export const MAX_IMAGE_BYTES = 400_000;
export const MAX_BIO = 280;
export const MAX_VCF_PHOTO_BYTES = 80_000;

export const TEMPLATE_META: Record<CardTemplateId, { label: string; description: string }> = {
  minimal: {
    label: "Minimal",
    description: "Centered name, photo, and a quiet contact stack.",
  },
  corporate: {
    label: "Corporate",
    description: "Photo beside details, with a logo and QR column.",
  },
  bold: {
    label: "Bold",
    description: "Accent side panel, high contrast type, and social row.",
  },
  compact: {
    label: "Compact",
    description: "Horizontal strip for a dense contact card.",
  },
};

export const FONT_STACKS: Record<CardFont, string> = {
  sans: "Arial, Helvetica, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Courier New', Courier, monospace",
};

export const SOCIAL_LABELS: Record<CardSocialId, string> = {
  linkedin: "LinkedIn",
  x: "X",
  facebook: "Facebook",
  instagram: "Instagram",
  github: "GitHub",
  other: "Link",
};

export const EMPTY_FIELDS: CardFields = {
  fullName: "",
  jobTitle: "",
  company: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  bio: "",
  linkedin: "",
  x: "",
  facebook: "",
  instagram: "",
  github: "",
  other: "",
};

export const DEFAULT_OPTIONS: CardOptions = {
  template: "corporate",
  accentColor: DEFAULT_ACCENT,
  backgroundColor: DEFAULT_BACKGROUND,
  textColor: DEFAULT_TEXT,
  font: "sans",
  showPhoto: true,
  showLogo: true,
  showQr: true,
  showSocial: true,
};

export const EXAMPLE_INPUT: CardInput = {
  fields: {
    fullName: "Jane Rivera",
    jobTitle: "Head of Product",
    company: "Northwind Labs",
    phone: "+1 415 555 0198",
    email: "jane@northwindlabs.example",
    website: "https://northwindlabs.example",
    address: "210 Market Street, San Francisco, CA",
    bio: "Builds practical product tools. Happiest when the work stays in the browser.",
    linkedin: "https://www.linkedin.com/in/example",
    x: "https://x.com/example",
    facebook: "",
    instagram: "",
    github: "https://github.com/example",
    other: "",
  },
  photoDataUrl: null,
  logoDataUrl: null,
  options: { ...DEFAULT_OPTIONS },
};

export const EMPTY_INPUT: CardInput = {
  fields: { ...EMPTY_FIELDS },
  photoDataUrl: null,
  logoDataUrl: null,
  options: { ...DEFAULT_OPTIONS },
};

export function isCardTemplate(value: string): value is CardTemplateId {
  return (CARD_TEMPLATES as readonly string[]).includes(value);
}

export function isCardFont(value: string): value is CardFont {
  return (CARD_FONTS as readonly string[]).includes(value);
}
