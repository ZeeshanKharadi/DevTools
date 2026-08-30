import type { ToolContent } from "./types";

export const uuidGeneratorContent: ToolContent = {
  privacy: "Processed locally — identifiers are created in your browser.",
  howTo: [
    {
      title: "Generate a UUID v4",
      body: "Click Generate UUID. The UUID generator uses crypto.randomUUID() in your browser. Nothing is sent to a server.",
    },
    {
      title: "Generate several at once",
      body: "Set the count from 1 to 100, then generate. Each value is a random UUID v4.",
    },
    {
      title: "Copy what you need",
      body: "Copy one UUID, or copy all. Clear removes the list. Generate again to replace it.",
    },
  ],
  examples: [
    {
      title: "One random UUID",
      body: "Leave the count at 1 and generate. You get a single UUID v4 such as 550e8400-e29b-41d4-a716-446655440000.",
    },
    {
      title: "A batch of identifiers",
      body: "Set the count to 10 when you need several test IDs. The list stays on this page until you clear or generate again.",
    },
  ],
  faq: [
    {
      question: "Does this UUID generator send values to a server?",
      answer:
        "No. Random UUID v4 values are created locally with the Web Crypto API.",
    },
    {
      question: "Is a UUID the same as a GUID?",
      answer:
        "People often use UUID and GUID interchangeably. This tool generates UUID version 4 (random). A GUID usually means the same 128-bit identifier in Microsoft documentation, but the names are not identical in every specification.",
    },
    {
      question: "Why is there a maximum count?",
      answer:
        "Generating a huge list can freeze the tab. V1 allows 1–100 UUIDs per click.",
    },
  ],
};
