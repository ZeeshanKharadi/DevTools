import type { ToolContent } from "./types";

export const organizePdfContent: ToolContent = {
  privacy:
    "Processed locally — your PDFs never leave this browser. Nothing is uploaded.",
  intro:
    "Organize PDF Pages Online Free lets you reorder, delete, duplicate, and rotate pages visually, then download a new PDF. Everything runs on your device.",
  howTo: [
    {
      title: "Upload a PDF",
      body: "Drop a multipage PDF to load thumbnails. Encrypted or damaged files are rejected with a clear message.",
    },
    {
      title: "Edit the layout",
      body: "Drag pages or use Move left/right. Duplicate, delete, and rotate selected pages. Each page keeps a stable identity even after duplication.",
    },
    {
      title: "Download",
      body: "Export infyratools-organized.pdf with the new order and rotations. Vector text stays selectable—pages are not rasterized.",
    },
  ],
  examples: [
    {
      title: "Fix a scanned packet",
      body: "Move a cover page to the front, delete blank sheets, and rotate sideways scans before sharing.",
    },
    {
      title: "Duplicate a form page",
      body: "Duplicate a blank form page, then reorder copies for each recipient.",
    },
  ],
  faq: [
    {
      question: "Is the organizer free?",
      answer:
        "Yes. You can organize PDFs without creating an account. Processing stays in your browser.",
    },
    {
      question: "Can I export an empty PDF?",
      answer:
        "No. Keep at least one page, or reset the layout to restore the original pages.",
    },
    {
      question: "Does rotation rasterize the page?",
      answer:
        "No. Rotation is applied with pdf-lib so text and vectors remain intact.",
    },
  ],
};
