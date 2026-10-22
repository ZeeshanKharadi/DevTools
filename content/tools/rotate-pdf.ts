import type { ToolContent } from "./types";

export const rotatePdfContent: ToolContent = {
  privacy:
    "Processed locally — rotation uses your browser only. Nothing is uploaded.",
  intro:
    "Rotate PDF Online Free turns individual pages or the whole document by 90°, 180°, or 270°. Preview the orientation, then download a new PDF without rasterizing text.",
  howTo: [
    {
      title: "Upload a PDF",
      body: "Drop a PDF to preview pages. Previews load in batches for longer documents.",
    },
    {
      title: "Choose rotations",
      body: "Rotate one page at a time or apply 90/180/270 to every page. Existing PDF rotation is respected.",
    },
    {
      title: "Download",
      body: "Save infyratools-rotated.pdf. Page order stays the same; only orientation changes.",
    },
  ],
  examples: [
    {
      title: "Fix a sideways scan",
      body: "Rotate page 2 by 90° while leaving the rest unchanged.",
    },
    {
      title: "Flip a full packet",
      body: "Use Rotate all 180° when every page is upside down.",
    },
  ],
  faq: [
    {
      question: "Does rotation flatten the PDF?",
      answer:
        "No. Pages keep their vector content. This tool updates page rotation metadata instead of converting pages to images.",
    },
    {
      question: "Can I undo rotations?",
      answer:
        "Use Reset rotations before downloading, or Reset to clear the whole tool.",
    },
    {
      question: "Is Rotate PDF free?",
      answer:
        "Yes. No account is required for local rotation and download.",
    },
  ],
};
