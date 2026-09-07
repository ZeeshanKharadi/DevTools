export type LegalSection = {
  heading: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
};

export type LegalDocument = {
  path: "/privacy-policy" | "/terms" | "/disclaimer";
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: readonly LegalSection[];
};
