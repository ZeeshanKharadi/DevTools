import type { ToolContent } from "./types";

export const imageResizerContent: ToolContent = {
  privacy:
    "Processed locally — your images never leave this browser. Nothing is uploaded.",
  intro:
    "Resize JPG, PNG, and WebP images online for free. Use exact pixels, percentages, or presets with contain, cover, or stretch fit modes.",
  howTo: [
    {
      title: "Add images",
      body: "Drop one or more supported images. Each preview shows original dimensions and size.",
    },
    {
      title: "Choose dimensions",
      body: "Enter width/height with optional aspect lock, use a percentage, or pick a preset. Unlocked mode supports contain, cover, and stretch.",
    },
    {
      title: "Export",
      body: "Download individual results or a ZIP. Filenames include the output dimensions.",
    },
  ],
  examples: [
    {
      title: "Social square",
      body: "Use the 1080×1080 preset with contain and a background color for padded exports.",
    },
    {
      title: "Half-size copies",
      body: "Set percentage to 50% to shrink a batch of screenshots quickly.",
    },
  ],
  faq: [
    {
      question: "Will presets crop my image?",
      answer:
        "Presets set the output box. With contain, the image fits inside without cropping. Cover crops to fill. Stretch may change proportions.",
    },
    {
      question: "Do you upload my images?",
      answer: "No. Resizing runs entirely in your browser.",
    },
    {
      question: "Which formats are supported?",
      answer: "JPG/JPEG, PNG, and WebP, depending on browser encoding support.",
    },
  ],
};
