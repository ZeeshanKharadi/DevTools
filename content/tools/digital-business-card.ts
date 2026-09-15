import type { ToolContent } from "./types";

export const digitalBusinessCardContent: ToolContent = {
  privacy:
    "Preview, vCard, and PNG stay in your browser. Signing in to host a card is optional and stores structured contact details in your InfyraTools account.",
  intro:
    "This free digital business card generator builds a contact card you can preview, download as a vCard, or export as a PNG. The QR code encodes a static vCard. Without an account the card stays on this device. Signed-in users can also publish a hosted page.",
  howTo: [
    {
      title: "Add your details",
      body: "Enter a name, role, company, and the phone, email, or website you want public. Leave unused social fields blank. Local photos stay on this device.",
    },
    {
      title: "Pick a layout",
      body: "Minimal, Corporate, Bold, and Compact update the live preview. Accent, background, text color, and font change the card without leaving the page.",
    },
    {
      title: "Download or copy",
      body: "Download vCard for phone contacts, Download PNG for a shareable image, or copy a plain-text contact block. Reset clears the form. Sign in if you want a public InfyraTools URL.",
    },
  ],
  examples: [
    {
      title: "Conference follow-up card",
      body: "Name, title, company, and a LinkedIn URL with a contact QR. Hand someone the PNG or let them scan the vCard QR.",
    },
    {
      title: "Freelance contact strip",
      body: "Compact layout, phone and email only, no bio. Useful when you want a dense card for a slide or email signature companion.",
    },
  ],
  bestPractices: [
    {
      title: "Hosting is optional",
      body: "The free generator still works without an account. A hosted page at /card/<slug> is only created when you sign in and save. Local file photos are not stored; use an https:// image URL for public photos.",
    },
    {
      title: "Keep the QR small",
      body: "The QR uses the same static vCard encoder as the QR Code Generator. Photos are not packed into the QR. Large bios belong in the vCard file, not the code.",
    },
  ],
  bestPracticesHeading: "Card tips",
  faq: [
    {
      question: "Is this a free digital business card generator?",
      answer:
        "Yes. You can design a contact card, download a vCard, and export a PNG in the browser without an account.",
    },
    {
      question: "Do I get a public URL for my card?",
      answer:
        "Not from the anonymous generator. Sign in and save the card to publish a public page at infyratools.com/card/<slug>. Custom domains are not available yet.",
    },
    {
      question: "What is in the QR code?",
      answer:
        "A static vCard built from your name, company, title, phone, email, website, and address. It is generated with the existing QR library. The destination cannot be edited after you share the image.",
    },
    {
      question: "Will recipients see my local profile photo?",
      answer:
        "They will see it on a PNG you send, and it may be embedded in the vCard if the image is small. A file chosen only for this preview is not uploaded to a server.",
    },
  ],
};
