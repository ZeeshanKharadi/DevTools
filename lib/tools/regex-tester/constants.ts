export const REGEX_MATCH_TIMEOUT_MS = 250;

export const MAX_DISPLAYED_MATCHES = 200;

export const REGEX_FLAGS = ["d", "g", "i", "m", "s", "u", "v", "y"] as const;

export type RegexFlag = (typeof REGEX_FLAGS)[number];

export const REGEX_FLAG_LABELS: Record<RegexFlag, string> = {
  d: "Generate match indices",
  g: "Global (all matches)",
  i: "Ignore case",
  m: "Multiline ^ $",
  s: "Dot matches newline",
  u: "Unicode",
  v: "Unicode sets",
  y: "Sticky",
};

export const REGEX_TESTER_EXAMPLE = {
  pattern: "(\\d{4})-(\\d{2})-(\\d{2})",
  flags: "g",
  text: "ISO dates: 2024-01-15 and 1999-12-31, plus not-a-date 24-1-5.",
};
