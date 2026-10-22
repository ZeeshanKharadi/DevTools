import type { ToolContent } from "./types";

export const pdfToJpgContent: ToolContent = {
  privacy:
    "Processed locally — PDF pages are rendered in your browser to JPG. Nothing is uploaded.",
  intro:
    "Convert PDF pages into JPG images online for free. Preview pages, pick quality and scale, then download one image or a ZIP of selected pages.",
  howTo: [
    {
      title: "Upload a PDF",
      body: "Drop a PDF to load page count and thumbnails. Previews load in batches for larger files.",
    },
    {
      title: "Select pages and quality",
      body: "Choose pages or enter a range. Adjust JPG quality and render scale for sharper output.",
    },
    {
      title: "Download",
      body: "One selected page downloads as a JPG. Multiple pages download as infyratools-pdf-images.zip.",
    },
  ],
  examples: [
    {
      title: "Share a single page",
      body: "Select page 1 and download infyratools-page-1.jpg for chat or email.",
    },
    {
      title: "Archive every page",
      body: "Select all pages and download a ZIP of JPG images for offline review.",
    },
  ],
  faq: [
    {
      question: "Does PDF to JPG keep text selectable?",
      answer:
        "No. JPG is a raster image. Use this when you need pictures of pages, not editable text.",
    },
    {
      question: "Why is conversion sequential?",
      answer:
        "Pages render one at a time to reduce browser memory use on large documents.",
    },
    {
      question: "Is it free?",
      answer:
        "Yes. Conversion is free and stays in your browser.",
    },
  ],
};
