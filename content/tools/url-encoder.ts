import type { ToolContent } from "./types";

export const urlEncoderContent: ToolContent = {
  privacy: "Processed locally — your text never leaves your browser.",
  howTo: [
    {
      title: "Enter a string",
      body: "Paste the text or encoded component you want to convert. Work stays in your browser.",
    },
    {
      title: "Encode or decode",
      body: "Encode uses encodeURIComponent. Decode uses decodeURIComponent. Ctrl+Enter / Cmd+Enter encodes. Swap exchanges the two panels.",
    },
    {
      title: "Copy the result",
      body: "Copy the output for query strings or path segments. This is component encoding, not a full-URL rewrite.",
    },
  ],
  examples: [
    {
      title: "Encode a search query",
      body: "hello world becomes hello%20world. Spaces, ampersands, and unicode are escaped.",
    },
    {
      title: "Decode a component",
      body: "caf%C3%A9 becomes café.",
    },
  ],
  faq: [
    {
      question: "Is this the same as encodeURI?",
      answer:
        "No. This tool uses encodeURIComponent and decodeURIComponent, which escape reserved characters such as &, =, and ?. That is what you want for a single query value, not for rewriting an entire URL.",
    },
    {
      question: "Does the URL encoder upload my text?",
      answer: "No. Encoding and decoding run entirely in your browser.",
    },
    {
      question: "Why did decode fail?",
      answer:
        "decodeURIComponent rejects incomplete percent sequences such as %E0%A4%A. Fix the encoding or encode the text again.",
    },
  ],
};
