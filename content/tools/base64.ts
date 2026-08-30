import type { ToolContent } from "./types";

export const base64Content: ToolContent = {
  privacy: "Processed locally — your text never leaves your browser.",
  howTo: [
    {
      title: "Enter plain text or Base64",
      body: "Type or paste into the input. Unicode is supported. Encoding and decoding run in your browser.",
    },
    {
      title: "Encode or decode",
      body: "Encode turns text into Base64. Decode turns Base64 back into text. Ctrl+Enter / Cmd+Enter encodes. Swap exchanges input and output.",
    },
    {
      title: "Copy the result",
      body: "Copy the output when you need it. Clear resets both panels.",
    },
  ],
  examples: [
    {
      title: "Encode ASCII",
      body: 'hello becomes aGVsbG8=.',
    },
    {
      title: "Encode unicode",
      body: "Characters such as 世界 are encoded with UTF-8, then Base64. Decoding restores the original text.",
    },
  ],
  faq: [
    {
      question: "Is this Base64 encoder sending data to a server?",
      answer:
        "No. Encode and decode run locally with the Web APIs in your browser.",
    },
    {
      question: "Does it support unicode?",
      answer:
        "Yes. Text is converted with UTF-8 before encoding, and decoded back to unicode text.",
    },
    {
      question: "Why did decode fail?",
      answer:
        "The input must be valid Base64 (A–Z, a–z, 0–9, +, /, and padding). Extra symbols or truncated strings will produce a clear error.",
    },
  ],
};
