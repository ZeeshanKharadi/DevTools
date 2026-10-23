import type { ToolContent } from "./types";

export const signPdfContent: ToolContent = {
  privacy:
    "Processed locally — PDFs and signatures never leave this browser and are not saved to an account.",
  intro:
    "Draw, type, or upload a signature and place it on a PDF online for free. This adds a visible electronic signature only—not a certificate-backed digital signature.",
  howTo: [
    {
      title: "Upload a PDF",
      body: "Drop the document and choose the page you want to sign.",
    },
    {
      title: "Create a signature",
      body: "Draw with a mouse or finger, type your name in a signature-style font, or upload a PNG/JPG.",
    },
    {
      title: "Place and download",
      body: "Position the signature on the preview, then download infyratools-signed.pdf. Reset clears signature data from memory.",
    },
  ],
  examples: [
    {
      title: "Approve a quote",
      body: "Type your name, place it on the signature line, and send the PDF back.",
    },
    {
      title: "Use a transparent PNG",
      body: "Upload a scanned signature with a transparent background for cleaner placement.",
    },
  ],
  faq: [
    {
      question: "Is this a legally certified digital signature?",
      answer:
        "No. InfyraTools adds a visible electronic signature image. It does not provide certificate-based identity verification or cryptographic signing.",
    },
    {
      question: "Are signatures stored?",
      answer:
        "No. Signatures stay in browser memory for the session and are cleared when you reset or leave the page.",
    },
    {
      question: "Can I sign multiple pages?",
      answer:
        "Yes. Place the same signature on different pages before downloading.",
    },
  ],
};
