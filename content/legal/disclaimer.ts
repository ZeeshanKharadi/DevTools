import type { LegalDocument } from "./types";

export const disclaimer: LegalDocument = {
  path: "/disclaimer",
  title: "Disclaimer",
  description:
    "Limitations of InfyraTools utilities, including invoices, JWTs, SQL, QR codes, email signatures, and generated output.",
  h1: "Disclaimer",
  intro:
    "This Disclaimer explains the nature and limits of InfyraTools. The tools are practical utilities, not a substitute for professional review. Read this together with the Terms of Use and Privacy Policy.",
  sections: [
    {
      heading: "General nature of the tools",
      paragraphs: [
        "InfyraTools provides free, browser-based utilities. They help you inspect, format, generate, or export information that you supply. They are not a law firm, accounting firm, tax authority, security auditor, or managed IT service.",
        "Developer tools and generated outputs should be independently reviewed before production use. You are responsible for checking results in the environment where you will actually use them.",
      ],
    },
    {
      heading: "Accuracy and limitation of reliance",
      paragraphs: [
        "InfyraTools does not warrant that any output is complete, current, or appropriate for your purpose. Rounding, encoding, templates, and previews can differ from what another system, email client, scanner, or regulator expects. Do not rely on InfyraTools as the sole check before sending money, deploying code, publishing a signature, or encoding a destination.",
      ],
    },
    {
      heading: "Invoice Generator",
      paragraphs: [
        "The Invoice Generator creates a document from the details you enter. It does not provide tax, accounting, or legal advice. Per-line tax percentages and discounts are arithmetic on the amounts you type; they are not a filing, a VAT engine, or a guarantee of jurisdiction-specific invoice compliance. Confirm required fields, tax treatment, and record-keeping rules where you do business.",
      ],
    },
    {
      heading: "JWT Decoder",
      paragraphs: [
        "The JWT Decoder shows header and payload information from a token you paste. It does not verify signatures, authenticity, expiration in a live system, or whether a token should be trusted. Decoding is not authentication.",
      ],
    },
    {
      heading: "SQL Formatter",
      paragraphs: [
        "The SQL Formatter rearranges SQL text for readability using supported dialects listed on the tool page. It does not guarantee that statements are valid, safe, or will execute successfully. It is not a query engine, linter of every dialect, or protection against harmful SQL.",
      ],
    },
    {
      heading: "QR Code Generator",
      paragraphs: [
        "You are responsible for the content and destinations you encode. A static QR code stores what you put into it, including URLs, Wi-Fi details, and contact data. InfyraTools does not control where a scan goes after you share the image. Test scans before printing or distributing a code, especially if a logo or unusual colors are used.",
      ],
    },
    {
      heading: "Email Signature Generator",
      paragraphs: [
        "Generated HTML may render differently across Gmail, Outlook, Apple Mail, and other clients. Clients may strip styles, block local or data-URI images, or alter layout. Hosted image URLs and a check in your actual mailbox are your responsibility.",
      ],
    },
    {
      heading: "Digital Business Card",
      paragraphs: [
        "vCard files, PNG exports, and contact QR codes are generated from information you supply. InfyraTools does not host a public card URL, verify contact details, or keep a copy of the card on a server. Photos you select stay on your device unless you later publish the exported file yourself.",
      ],
    },
    {
      heading: "Availability and external links",
      paragraphs: [
        "The website may be interrupted or changed without notice. Links to InfyraEdge or other sites, and destinations inside generated signatures or QR codes, are outside InfyraTools. Those operators are responsible for their own content and practices.",
      ],
    },
    {
      heading: "Professional advice",
      paragraphs: [
        "Nothing on InfyraTools is professional legal, tax, accounting, security, or medical advice. If you need advice of that kind, consult a qualified professional in the relevant jurisdiction.",
      ],
    },
    {
      heading: "Contact",
      paragraphs: [
        "Questions about this Disclaimer may be directed to InfyraEdge through infyraedge.com.",
      ],
    },
  ],
};
