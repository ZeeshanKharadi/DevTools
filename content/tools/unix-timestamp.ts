import type { ToolContent } from "./types";

export const unixTimestampContent: ToolContent = {
  privacy: "Processed locally — your timestamps never leave your browser.",
  howTo: [
    {
      title: "Convert a Unix timestamp to a date",
      body: "Enter the number and choose seconds or milliseconds. The converter shows UTC, your local timezone, and ISO 8601. It does not guess the unit from the number of digits.",
    },
    {
      title: "Convert a date to a Unix timestamp",
      body: "Pick a local date and time. The output is Unix seconds and Unix milliseconds.",
    },
    {
      title: "Use the current time",
      body: "Current timestamp shows now in both units. Copy any value you need. All work stays in the browser.",
    },
  ],
  examples: [
    {
      title: "Unix epoch",
      body: "0 seconds is 1970-01-01 00:00:00 UTC, the Unix epoch.",
    },
    {
      title: "Seconds versus milliseconds",
      body: "1516239022 seconds is 2018-01-18T01:30:22.000Z. The same digits as milliseconds are a different, earlier instant. Choose the unit explicitly.",
    },
  ],
  faq: [
    {
      question: "What is a Unix timestamp?",
      answer:
        "A Unix timestamp (epoch time) is the number of seconds — or sometimes milliseconds — since 1970-01-01T00:00:00Z.",
    },
    {
      question: "Does this epoch converter upload my values?",
      answer: "No. Conversion uses the browser Date API only.",
    },
    {
      question: "Which timezone is “local”?",
      answer:
        "Local means your current browser timezone. UTC and ISO 8601 are timezone-independent.",
    },
  ],
};
