import type { FaqItem } from "./tools/types";

export const homeFaq: readonly FaqItem[] = [
  {
    question: "Are these developer tools free?",
    answer: "Yes. The V1 tools are free and do not require an account.",
  },
  {
    question: "Is my data sent to a server?",
    answer:
      "No. Each V1 tool processes input in your browser. We do not upload what you paste into a tool.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. Open a tool in the browser and use it. There is no desktop app or browser extension.",
  },
  {
    question: "Do the tools work after the page loads?",
    answer:
      "Yes. Once a tool page has loaded, its work stays on your device. This site is not a full offline app.",
  },
];
