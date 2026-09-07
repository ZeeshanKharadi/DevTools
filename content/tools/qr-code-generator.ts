import type { ToolContent } from "./types";

export const qrCodeGeneratorContent: ToolContent = {
  privacy:
    "Processed locally — URLs, Wi-Fi passwords, and contact details never leave your browser.",
  intro:
    "This free QR Code Generator builds a static QR code in your browser for a URL, plain text, email, phone, SMS, Wi-Fi network, or vCard. Download PNG or SVG, or copy the image. The destination is baked into the code and cannot be edited later.",
  howTo: [
    {
      title: "Choose a QR type",
      body: "Pick URL, plain text, email, phone, SMS, Wi-Fi, or vCard / contact. A URL QR Code Generator is the default; switch to WiFi QR Code Generator or vCard QR Code Generator when you need those payloads.",
    },
    {
      title: "Enter the content",
      body: "Fill in only the fields you need. Wi-Fi names and passwords are escaped so special characters stay in the network config instead of breaking the payload. vCards are built from the form — raw vCard text is never executed.",
    },
    {
      title: "Adjust the look and download",
      body: "Size, margin, colors, and error-correction update the live preview. Download PNG for sharing, SVG for print, or copy the QR image where your browser allows. Use Reset to start over.",
    },
  ],
  examples: [
    {
      title: "URL QR Code Generator",
      body: "Encode https://example.com so a phone camera opens that page. Because this is a static QR code, reprint a new one if the website moves.",
    },
    {
      title: "WiFi QR Code Generator",
      body: "Create a guest-network code with SSID, WPA password, and optional hidden-network flag. Scanning connects without typing the password. Treat the printed code like the password itself.",
    },
    {
      title: "vCard QR Code Generator",
      body: "Put a name, phone, email, and website into a contact QR. Phones that support vCard can save the details. This is not a hosted digital business card with an editable destination.",
    },
  ],
  faq: [
    {
      question: "Is this a free QR Code Generator?",
      answer:
        "Yes. You can create URL, text, email, phone, SMS, Wi-Fi, and vCard QR codes in the browser. There is no account, upload, or watermark from this site.",
    },
    {
      question: "Can I change the destination after I generate the code?",
      answer:
        "No. These are static QR codes. The URL, Wi-Fi details, or vCard are encoded in the image. Changing them later requires generating and sharing a new code. Editable destinations and scan analytics would need a server and are not included here.",
    },
    {
      question: "Does a WiFi QR Code Generator send my password to a server?",
      answer:
        "No. The Wi-Fi payload is built and encoded on this page. The password is inside the QR code by design, so anyone who scans or reads the payload can see it.",
    },
    {
      question: "What is the difference between PNG and SVG download?",
      answer:
        "PNG is a bitmap for chat, email, and the web. SVG scales cleanly for print. Both contain the same static payload. Copy QR image uses a PNG when the browser clipboard supports images.",
    },
    {
      question: "Is a center logo safe?",
      answer:
        "A small raster logo is overlaid and the code is generated with high error correction (H). Keep the logo modest. Very large logos, low contrast colors, or a zero margin can make scanning fail.",
    },
    {
      question: "Do you store my QR codes?",
      answer:
        "No. Nothing is saved on a server. Saved QR codes, custom domains, bulk generation, and hosted short URLs are possible later as separate Pro features without changing this static generator.",
    },
  ],
};
