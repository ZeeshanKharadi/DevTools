import type { ToolContent } from "./types";

export const jsonValidatorContent: ToolContent = {
  privacy: "Processed locally — your JSON never leaves your browser.",
  howTo: [
    {
      title: "Paste the JSON to check",
      body: "Put the JSON into the input area. Use Paste or Load example. Validation runs in your browser.",
    },
    {
      title: "Validate",
      body: "Choose Validate, or press Ctrl+Enter / Cmd+Enter. The JSON validator reports whether the syntax is valid.",
    },
    {
      title: "Read the result",
      body: "Valid JSON is confirmed clearly. Invalid JSON shows a readable error and, when possible, the line and column.",
    },
  ],
  examples: [
    {
      title: "Valid JSON",
      body: '{"ok":true,"items":[1,2]} is valid. The validator confirms it without changing your input.',
    },
    {
      title: "Trailing comma",
      body: '{"name":"Ada",} is invalid JSON. The error includes a line and column so you can find the extra comma.',
    },
  ],
  faq: [
    {
      question: "Does this JSON validator upload my data?",
      answer:
        "No. JSON validation runs locally in your browser. Nothing is sent to a server.",
    },
    {
      question: "How is this different from the JSON formatter?",
      answer:
        "This page only checks JSON syntax. The JSON formatter can also pretty-print and minify. Both share the same local parser.",
    },
    {
      question: "What if the error has no line number?",
      answer:
        "Most invalid JSON includes a location. If the browser and the fallback locator cannot find one, you still get a clear message without a stack trace.",
    },
  ],
};
