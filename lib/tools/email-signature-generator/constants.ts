import type {
  EmailSafeFont,
  SignatureFields,
  SignatureInput,
  SignatureOptions,
  SignatureTemplateId,
  SocialNetwork,
} from "./types";

export const DEFAULT_ACCENT_COLOR = "#0f6e56";
export const DEFAULT_TEXT_COLOR = "#1b1914";
export const DEFAULT_MUTED_COLOR = "#5e594f";

export const MAX_IMAGE_BYTES = 750_000;

export const FONT_STACKS: Record<EmailSafeFont, string> = {
  arial: "Arial, Helvetica, sans-serif",
  helvetica: "Helvetica, Arial, sans-serif",
  georgia: "Georgia, 'Times New Roman', Times, serif",
  times: "'Times New Roman', Times, serif",
  tahoma: "Tahoma, Verdana, sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
  trebuchet: "'Trebuchet MS', Helvetica, sans-serif",
  courier: "'Courier New', Courier, monospace",
};

export const FONT_SIZE_PX: Record<"small" | "medium" | "large", number> = {
  small: 12,
  medium: 14,
  large: 16,
};

export const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  linkedin: "LinkedIn",
  x: "X",
  facebook: "Facebook",
  instagram: "Instagram",
  github: "GitHub",
};

export const TEMPLATE_META: Record<
  SignatureTemplateId,
  { label: string; description: string }
> = {
  minimal: {
    label: "Minimal",
    description: "Stacked name and contact lines with no extra chrome.",
  },
  corporate: {
    label: "Corporate",
    description: "Photo beside details, with a left accent bar and logo.",
  },
  modern: {
    label: "Modern",
    description: "Accent underline, photo column, and a social row.",
  },
  compact: {
    label: "Compact",
    description: "Single-block layout with pipe-separated contact details.",
  },
  executive: {
    label: "Executive",
    description: "Centered logo, large name, and a formal horizontal rule.",
  },
};

export const EMPTY_FIELDS: SignatureFields = {
  fullName: "",
  jobTitle: "",
  company: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  linkedin: "",
  x: "",
  facebook: "",
  instagram: "",
  github: "",
};

export const DEFAULT_OPTIONS: SignatureOptions = {
  template: "minimal",
  accentColor: DEFAULT_ACCENT_COLOR,
  textColor: DEFAULT_TEXT_COLOR,
  fontFamily: "arial",
  fontSize: "medium",
  showPhoto: true,
  showLogo: true,
  showSocial: true,
  showDivider: true,
};

export const EXAMPLE_FIELDS: SignatureFields = {
  fullName: "Jane Rivera",
  jobTitle: "Head of Product",
  company: "Northwind Labs",
  email: "jane@northwindlabs.example",
  phone: "+1 415 555 0198",
  website: "https://northwindlabs.example",
  address: "210 Market Street, San Francisco, CA",
  linkedin: "https://www.linkedin.com/in/example",
  x: "https://x.com/example",
  facebook: "https://www.facebook.com/example",
  instagram: "https://www.instagram.com/example",
  github: "https://github.com/example",
};

export const EXAMPLE_INPUT: SignatureInput = {
  fields: EXAMPLE_FIELDS,
  photo: { origin: "none", url: "" },
  logo: { origin: "none", url: "" },
  options: DEFAULT_OPTIONS,
};

export const EMPTY_IMAGE = { origin: "none" as const, url: "" };

export const EMPTY_INPUT: SignatureInput = {
  fields: EMPTY_FIELDS,
  photo: EMPTY_IMAGE,
  logo: EMPTY_IMAGE,
  options: DEFAULT_OPTIONS,
};
