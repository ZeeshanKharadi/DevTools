import type { ToolContent } from "./types";

export const emailSignatureGeneratorContent: ToolContent = {
  privacy:
    "Preview, copy, and download stay in your browser. Signing in to save is optional and stores structured signature details in your InfyraTools account — not generated HTML.",
  intro:
    "This free HTML email signature generator builds a professional signature you can paste into Gmail, Outlook, or Apple Mail. Choose a template, add only the fields you need, and copy rich HTML. Empty fields are left out of the markup.",
  howTo: [
    {
      title: "Fill in your details",
      body: "Add your name, title, company, and the contact methods you want public. Leave anything blank and it will not appear in the signature.",
    },
    {
      title: "Pick a template and colors",
      body: "Switch between Minimal, Corporate, Modern, Compact, and Executive. Accent color, text color, email-safe fonts, and font size update the live preview immediately.",
    },
    {
      title: "Copy into your email app",
      body: "Use Copy signature to place rich HTML on the clipboard, then paste it into Gmail, Outlook, or Apple Mail signature settings. Copy HTML or Download HTML if you need the source.",
    },
  ],
  install: [
    {
      title: "Gmail",
      body: "Open Gmail Settings → See all settings → General → Signature. Create a signature, paste with Ctrl+V or Cmd+V, then save changes. Gmail is a Gmail signature generator target: paste the copied signature, don’t upload the HTML file.",
    },
    {
      title: "Outlook (Microsoft 365 or Outlook on the web)",
      body: "Open Settings → Accounts → Signatures, or File → Options → Mail → Signatures in classic Outlook. Paste the copied signature into the editor and set it as the default for new messages.",
    },
    {
      title: "Apple Mail",
      body: "On a Mac, open Mail → Settings → Signatures. Select a signature, paste, and confirm the preview. If Mail strips formatting, paste into a blank email first, select the signature, copy it again, then paste into Settings.",
    },
  ],
  examples: [
    {
      title: "Minimal HTML email signature",
      body: "Name, title, and a mailto link with no photo. Useful when you want a professional email signature that stays small in every client.",
    },
    {
      title: "Corporate signature with photo",
      body: "A left accent bar, profile photo, and company logo. Host the photo and logo on https:// URLs so recipients can see them.",
    },
  ],
  bestPractices: [
    {
      title: "Keep it short",
      body: "Name, role, company, and one or two contact methods are enough. Long quotes, disclaimers stacked in the signature, and giant images make messages harder to read.",
    },
    {
      title: "Use hosted images",
      body: "Email clients often strip data URLs and never load blob: URLs. If other people need to see a photo or logo, use a stable https:// image URL.",
    },
    {
      title: "Link email and phone",
      body: "mailto: and tel: links are built for you. That is more reliable than images of phone numbers.",
    },
  ],
  faq: [
    {
      question: "Is this a free email signature generator?",
      answer:
        "Yes. You can build and copy a professional HTML email signature in the browser without an account. Signing in is optional and only needed if you want to save signatures to reopen later.",
    },
    {
      question: "Does this work as a Gmail signature generator and Outlook signature generator?",
      answer:
        "Yes. Copy signature places rich HTML on the clipboard so you can paste into Gmail, Outlook, and Apple Mail. Clients still differ: some strip images or extra CSS.",
    },
    {
      question: "Will a local profile photo show for people who receive my email?",
      answer:
        "Usually not. A file chosen on this page is only on your device. Recipients need a hosted https:// image. This tool is designed so hosted image URLs can be added later as a Pro/cloud option without replacing the HTML engine.",
    },
    {
      question: "Is the exported markup safe to paste?",
      answer:
        "User text is escaped. Links are limited to http, https, mailto, and tel. javascript: URLs and raw HTML in fields are rejected or encoded, not executed.",
    },
    {
      question: "Do you store my signature?",
      answer:
        "No. V1 is browser-first. Nothing is saved on a server. Saved signatures and team management are possible later without changing how free generation works.",
    },
  ],
};
