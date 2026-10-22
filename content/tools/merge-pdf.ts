import type { ToolContent } from "./types";

export const mergePdfContent: ToolContent = {
  privacy:
    "Processed locally — your PDFs never leave this browser. Nothing is uploaded.",
  intro:
    "Merge PDF Online Free combines two or more PDF files into one downloadable document. Reorder files before merging. Everything runs on your device.",
  howTo: [
    {
      title: "Add PDFs",
      body: "Drop or browse two or more PDF files. Invalid, empty, or password-protected files are rejected with a clear message.",
    },
    {
      title: "Reorder and review",
      body: "Use Up and Down to set the merge order. Each file shows its name, size, and page count.",
    },
    {
      title: "Merge and download",
      body: "Click Merge PDF to build infyratools-merged.pdf in your browser, then download it. Use Reset to start over.",
    },
  ],
  examples: [
    {
      title: "Combine reports",
      body: "Join a cover page PDF with appendices into a single packet without desktop software.",
    },
    {
      title: "Keep source order",
      body: "Arrange scanned chapters top to bottom so the merged file matches the intended reading order.",
    },
  ],
  faq: [
    {
      question: "Is Merge PDF free?",
      answer:
        "Yes. You can merge PDFs without creating an account. Processing stays in your browser.",
    },
    {
      question: "Do you upload my PDFs?",
      answer:
        "No. Files are read and combined locally. Closing the tab clears them from memory.",
    },
    {
      question: "Can I merge password-protected PDFs?",
      answer:
        "Not while they remain encrypted. Unlock the files first, then merge the unlocked copies.",
    },
  ],
};
