import type { ToolContent } from "./types";

export const splitPdfContent: ToolContent = {
  privacy:
    "Processed locally — page extraction happens in your browser. Nothing is uploaded.",
  intro:
    "Split PDF Online Free lets you extract selected pages into one PDF or download pages as separate files in a ZIP. Use thumbnails or a range like 1-3,5,8-10.",
  howTo: [
    {
      title: "Upload a PDF",
      body: "Drop a PDF to see its page count and preview thumbnails. Large documents load previews in batches.",
    },
    {
      title: "Choose pages",
      body: "Click thumbnails or enter a range expression. Invalid numbers and out-of-range pages are rejected.",
    },
    {
      title: "Extract or ZIP",
      body: "Download one combined PDF, or get each selected page as its own PDF inside a ZIP archive.",
    },
  ],
  examples: [
    {
      title: "Pull a few pages",
      body: "Use 2,5,9 to extract only those pages into infyratools-extracted.pdf.",
    },
    {
      title: "Separate chapters",
      body: "Select ranges and download a ZIP when you need each page as its own file.",
    },
  ],
  faq: [
    {
      question: "Is Split PDF free?",
      answer:
        "Yes. Extracting and downloading pages does not require an account.",
    },
    {
      question: "What range formats work?",
      answer:
        "Use commas and hyphens, for example 1-3,5,8-10. Pages are unique and sorted automatically.",
    },
    {
      question: "Are encrypted PDFs supported?",
      answer:
        "Password-protected PDFs must be unlocked before splitting.",
    },
  ],
};
