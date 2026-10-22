import type { ToolContent } from "./types";

export const jpgToPdfContent: ToolContent = {
  privacy:
    "Processed locally — images stay in your browser while the PDF is built.",
  intro:
    "Convert JPG and PNG images into a multi-page PDF without uploading. Reorder images, pick A4, Letter, or fit-to-image sizing, then download.",
  howTo: [
    {
      title: "Add images",
      body: "Drop JPG, JPEG, or PNG files. Previews appear so you can confirm the order.",
    },
    {
      title: "Choose layout",
      body: "Select page size, orientation for fixed sizes, and margin. Aspect ratios are preserved.",
    },
    {
      title: "Create PDF",
      body: "Each image becomes one page in infyratools-images.pdf. Download stays on your device.",
    },
  ],
  examples: [
    {
      title: "Scan packet",
      body: "Turn phone photos of receipts into one PDF for emailing.",
    },
    {
      title: "Fit pages",
      body: "Use Fit to image when you want each page sized to the photo instead of A4 or Letter.",
    },
  ],
  faq: [
    {
      question: "Which image formats are supported?",
      answer:
        "JPG/JPEG and PNG. Other formats are rejected before conversion.",
    },
    {
      question: "Will images be cropped?",
      answer:
        "No. Images are scaled to fit inside the chosen page and margins while keeping aspect ratio.",
    },
    {
      question: "Is this free?",
      answer:
        "Yes. Conversion runs locally and does not require sign-in.",
    },
  ],
};
