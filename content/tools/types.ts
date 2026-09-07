export type HowToStep = {
  title: string;
  body: string;
};

export type ToolExample = {
  title: string;
  body: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type ToolContent = {
  howTo: HowToStep[];
  examples: ToolExample[];
  faq: FaqItem[];
  privacy?: string;
  intro?: string;
  bestPractices?: ToolExample[];
  bestPracticesHeading?: string;
  install?: HowToStep[];
  installHeading?: string;
};
