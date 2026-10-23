import type { ToolContent } from "./types";

export const imageCompressorContent: ToolContent = {
  privacy:
    "Processed locally — your images never leave this browser. Nothing is uploaded.",
  intro:
    "Compress JPG, PNG, and WebP images online for free. Compare sizes accurately and download individually or as a ZIP—all in your browser.",
  howTo: [
    {
      title: "Add images",
      body: "Drop one or more JPG, PNG, or WebP files. Previews show original dimensions and file size.",
    },
    {
      title: "Choose settings",
      body: "Pick output format, quality for lossy formats, and optional max width/height. PNG uses lossless canvas export—size savings mainly come from resizing.",
    },
    {
      title: "Download",
      body: "Compress, review savings (including when a result is larger), then download files or a ZIP archive.",
    },
  ],
  examples: [
    {
      title: "Shrink photos for email",
      body: "Lower JPEG quality and max width so attachments stay under mailbox limits.",
    },
    {
      title: "Batch WebP",
      body: "Convert a folder of product photos to WebP when your browser supports encoding.",
    },
  ],
  faq: [
    {
      question: "Why didn’t my PNG get much smaller?",
      answer:
        "Browser PNG export is lossless and does not expose a JPEG-style quality slider. Try reducing dimensions or choosing JPEG/WebP when lossy compression is acceptable.",
    },
    {
      question: "Do you upload my images?",
      answer: "No. Compression runs entirely in your browser.",
    },
    {
      question: "What if the result is larger?",
      answer:
        "We show the real sizes. You can keep the original or adjust quality and dimensions.",
    },
  ],
};
