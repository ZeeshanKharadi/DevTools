import type { ToolContent } from "./types";

export const watermarkPdfContent: ToolContent = {
  privacy:
    "Processed locally — your PDFs and watermark images never leave this browser.",
  intro:
    "Add text or image watermarks to PDF files for free. Adjust opacity, rotation, and position, then download. Files stay on your device.",
  howTo: [
    {
      title: "Upload a PDF",
      body: "Drop the document you want to stamp. Preview pages appear so you can confirm layout.",
    },
    {
      title: "Configure the watermark",
      body: "Choose text or an image, then set size, opacity, rotation, position, and which pages receive it.",
    },
    {
      title: "Download",
      body: "Apply the watermark and download infyratools-watermarked.pdf. Original content is preserved—not flattened into images.",
    },
  ],
  examples: [
    {
      title: "Mark drafts",
      body: "Stamp DRAFT diagonally across every page before sending an unfinished report.",
    },
    {
      title: "Brand first page",
      body: "Place a logo watermark on the first page only using a transparent PNG.",
    },
  ],
  faq: [
    {
      question: "Can I watermark only some pages?",
      answer:
        "Yes. Choose all pages, first, last, or a custom range such as 1-3,5.",
    },
    {
      question: "Do you upload my files?",
      answer:
        "No. The PDF and watermark image are processed locally in your browser.",
    },
    {
      question: "Will text stay selectable?",
      answer:
        "Yes. Watermarks are drawn on top of existing pages without rasterizing the whole document.",
    },
  ],
};
