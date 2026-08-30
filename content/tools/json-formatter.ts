import type { ToolContent } from "./types";

export const jsonFormatterContent: ToolContent = {
  privacy: "Processed locally — your JSON never leaves your browser.",
  howTo: [
    {
      title: "Paste or type JSON",
      body: "Put JSON into the input panel. Use Paste, or Load example for a sample object. The JSON formatter never uploads what you type.",
    },
    {
      title: "Format, minify, or validate",
      body: "Format pretty-prints JSON with 2-space indentation (JSON beautifier). Minify removes extra whitespace. Validate checks syntax without changing the output. Press Ctrl+Enter or Cmd+Enter to format.",
    },
    {
      title: "Copy or download the result",
      body: "Copy formatted JSON, or download it as a .json file. Clear resets the workspace. Processing stays in your browser.",
    },
  ],
  examples: [
    {
      title: "Pretty print compact JSON",
      body: 'Input {"name":"John","age":30,"active":true} and choose Format. The JSON formatter returns an indented object you can read and diff.',
    },
    {
      title: "Minify JSON",
      body: "Start from pretty-printed JSON and choose Minify to get a single compact line, useful for payloads and logs.",
    },
    {
      title: "Validate JSON and find the error",
      body: "A trailing comma or a missing quote is invalid JSON. Validate (or Format) shows a clear message with the line and column when the browser or the fallback locator can determine it.",
    },
  ],
  faq: [
    {
      question: "Does this JSON formatter send my data to a server?",
      answer:
        "No. Format JSON, minify JSON, and validate JSON all run in your browser. Nothing is uploaded or stored.",
    },
    {
      question: "What is the difference between format JSON and minify JSON?",
      answer:
        "Format JSON (pretty print / JSON beautifier) adds 2-space indentation and line breaks. Minify JSON removes unnecessary whitespace so the payload is smaller.",
    },
    {
      question: "What happens if my JSON is invalid?",
      answer:
        "You get a readable error, not a stack trace. When possible, the tool shows the line and column of the first problem so you can fix it.",
    },
    {
      question: "Can I format very large JSON?",
      answer:
        "Yes, within the browser. There is a recommended size limit. Very large input can slow or freeze the tab; the tool warns you as you approach that limit.",
    },
  ],
};
