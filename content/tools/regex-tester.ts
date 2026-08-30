import type { ToolContent } from "./types";

export const regexTesterContent: ToolContent = {
  privacy: "Processed locally — your pattern and text never leave your browser.",
  howTo: [
    {
      title: "Enter a JavaScript regular expression",
      body: "Type the pattern without surrounding slashes. Choose flags such as g, i, or m. Invalid patterns are caught and cannot crash the page.",
    },
    {
      title: "Add test text",
      body: "Paste the string to search. Matching runs in a Web Worker with a timeout so a runaway pattern is stopped instead of freezing the tab.",
    },
    {
      title: "Read matches and groups",
      body: "Each match shows its index and capture groups. Global search lists matches up to a display limit. Press Ctrl+Enter or Cmd+Enter to test.",
    },
  ],
  examples: [
    {
      title: "Dates with capture groups",
      body: "Pattern (\\d{4})-(\\d{2})-(\\d{2}) with flag g finds ISO dates and exposes year, month, and day groups.",
    },
    {
      title: "Case-insensitive word",
      body: "Pattern hello with flag i matches Hello and HELLO.",
    },
  ],
  faq: [
    {
      question: "Does this regex tester upload my text?",
      answer:
        "No. The pattern and test string stay in your browser. Matching runs in a local Web Worker.",
    },
    {
      question: "What happens if a pattern would freeze the page?",
      answer:
        "Matching is time-limited. If it exceeds the timeout, the worker is terminated and you see an error instead of a frozen tab.",
    },
    {
      question: "Which regex flavor is this?",
      answer:
        "JavaScript RegExp only. It is not PCRE, .NET, or Python. Flags are the standard JS set: d, g, i, m, s, u, v, y.",
    },
  ],
};
