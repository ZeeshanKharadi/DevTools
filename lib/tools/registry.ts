import type { Category, CategoryId, Tool, ToolSlug } from "./types";

export const CATEGORIES: readonly Category[] = [
  {
    id: "data",
    label: "Data",
    description: "Inspect and clean structured data.",
  },
  {
    id: "encoding",
    label: "Encoding",
    description: "Encode and decode common text formats.",
  },
  {
    id: "generators",
    label: "Generators",
    description: "Create identifiers and schedule expressions.",
  },
  {
    id: "time",
    label: "Time",
    description: "Convert timestamps and dates.",
  },
  {
    id: "text",
    label: "Text & Query",
    description: "Test patterns and format queries.",
  },
  {
    id: "business",
    label: "Business",
    description: "Create professional assets for email and outreach.",
  },
  {
    id: "pdf",
    label: "PDF",
    description:
      "Merge, split, convert, organize, watermark, and sign PDF files in your browser.",
  },
  {
    id: "images",
    label: "Images",
    description: "Compress and resize images locally in your browser.",
  },
] as const;

export const TOOLS: readonly Tool[] = [
  {
    slug: "json-formatter",
    name: "JSON Formatter",
    title: "JSON Formatter — Format, Minify & Validate JSON",
    h1: "JSON Formatter",
    description:
      "Format, minify, and validate JSON in your browser. Nothing is sent to a server.",
    category: "data",
    keywords: [
      "json",
      "format",
      "formatter",
      "pretty",
      "pretty-print",
      "beautify",
      "minify",
      "prettify",
      "indent",
    ],
    popular: true,
    related: ["json-validator", "base64", "jwt-decoder"],
    capabilities: ["copy", "clear", "paste", "download"],
  },
  {
    slug: "json-validator",
    name: "JSON Validator",
    title: "JSON Validator — Check JSON Syntax",
    h1: "JSON Validator",
    description:
      "Validate JSON and see clear error locations. Runs entirely in your browser.",
    category: "data",
    keywords: [
      "json",
      "validate",
      "validator",
      "validation",
      "syntax",
      "lint",
      "check",
      "parse",
    ],
    popular: false,
    related: ["json-formatter", "jwt-decoder"],
    capabilities: ["copy", "clear"],
  },
  {
    slug: "jwt-decoder",
    name: "JWT Decoder",
    title: "JWT Decoder — Decode JSON Web Tokens",
    h1: "JWT Decoder",
    description:
      "Decode a JWT header and payload in your browser. Decoding does not verify the signature.",
    category: "data",
    keywords: [
      "jwt",
      "token",
      "decode",
      "decoder",
      "claims",
      "json web token",
      "bearer",
      "header",
      "payload",
    ],
    popular: true,
    related: ["json-formatter", "base64", "unix-timestamp"],
    capabilities: ["copy", "clear", "paste"],
  },
  {
    slug: "base64",
    name: "Base64 Encoder / Decoder",
    title: "Base64 Encoder & Decoder",
    h1: "Base64 Encoder / Decoder",
    description:
      "Encode and decode Base64, including Unicode text, locally in your browser.",
    category: "encoding",
    keywords: [
      "base64",
      "encode",
      "encoder",
      "decode",
      "decoder",
      "encoding",
      "unicode",
    ],
    popular: true,
    related: ["url-encoder", "jwt-decoder"],
    capabilities: ["copy", "clear", "swap"],
  },
  {
    slug: "url-encoder",
    name: "URL Encoder / Decoder",
    title: "URL Encoder & Decoder",
    h1: "URL Encoder / Decoder",
    description:
      "Encode and decode URL components, including Unicode, in your browser.",
    category: "encoding",
    keywords: [
      "url",
      "uri",
      "encode",
      "encoder",
      "decode",
      "decoder",
      "percent-encoding",
      "query string",
      "unicode",
    ],
    popular: false,
    related: ["base64", "json-formatter"],
    capabilities: ["copy", "clear", "swap"],
  },
  {
    slug: "uuid-generator",
    name: "UUID Generator",
    title: "UUID Generator — Create UUID v4",
    h1: "UUID Generator",
    description: "Generate UUID v4 identifiers locally with the Web Crypto API.",
    category: "generators",
    keywords: [
      "uuid",
      "guid",
      "v4",
      "generate",
      "generator",
      "identifier",
      "unique id",
    ],
    popular: true,
    related: ["unix-timestamp", "base64"],
    capabilities: ["copy", "clear"],
  },
  {
    slug: "unix-timestamp",
    name: "Unix Timestamp Converter",
    title: "Unix Timestamp Converter",
    h1: "Unix Timestamp Converter",
    description:
      "Convert between Unix timestamps and dates. Seconds or milliseconds, local time or UTC.",
    category: "time",
    keywords: [
      "unix",
      "timestamp",
      "epoch",
      "date",
      "time",
      "milliseconds",
      "utc",
      "converter",
    ],
    popular: false,
    related: ["jwt-decoder", "cron-generator"],
    capabilities: ["copy", "clear"],
  },
  {
    slug: "regex-tester",
    name: "Regex Tester",
    title: "Regex Tester — Test Regular Expressions",
    h1: "Regex Tester",
    description:
      "Test regular expressions against sample text in your browser. Invalid patterns cannot crash the page.",
    category: "text",
    keywords: [
      "regex",
      "regexp",
      "regular expression",
      "match",
      "pattern",
      "test",
      "tester",
      "flags",
    ],
    popular: true,
    related: ["json-formatter", "url-encoder"],
    capabilities: ["copy", "clear"],
  },
  {
    slug: "sql-formatter",
    name: "SQL Formatter",
    title: "SQL Formatter",
    h1: "SQL Formatter",
    description:
      "Format SQL in your browser. Supported dialects are listed on the page; this is not a universal SQL parser.",
    category: "text",
    keywords: [
      "sql",
      "format",
      "formatter",
      "query",
      "pretty",
      "beautify",
      "dialect",
    ],
    popular: false,
    related: ["json-formatter", "regex-tester"],
    capabilities: ["copy", "clear", "paste", "download"],
  },
  {
    slug: "cron-generator",
    name: "Cron Expression Generator",
    title: "Cron Expression Generator",
    h1: "Cron Expression Generator",
    description:
      "Build a cron expression from minute, hour, day, month, and weekday, with a plain-language explanation.",
    category: "generators",
    keywords: ["cron", "schedule", "crontab", "expression", "job", "generator"],
    popular: false,
    related: ["unix-timestamp", "regex-tester"],
    capabilities: ["copy", "clear"],
  },
  {
    slug: "email-signature-generator",
    name: "Email Signature Generator",
    title: "Free Email Signature Generator — HTML Signatures for Gmail & Outlook",
    h1: "Email Signature Generator",
    description:
      "Create a professional HTML email signature in your browser. Copy it into Gmail, Outlook, or Apple Mail. Nothing is uploaded.",
    category: "business",
    keywords: [
      "email signature",
      "email signature generator",
      "free email signature generator",
      "html email signature",
      "professional email signature",
      "gmail signature",
      "outlook signature",
      "signature generator",
    ],
    popular: true,
    related: ["qr-code-generator", "digital-business-card"],
    capabilities: ["copy", "clear", "download"],
  },
  {
    slug: "qr-code-generator",
    name: "QR Code Generator",
    title: "Free QR Code Generator — URL, WiFi, vCard & More",
    h1: "QR Code Generator",
    description:
      "Create a static QR code in your browser for a URL, text, email, phone, SMS, Wi-Fi, or vCard. Download PNG or SVG. Nothing is uploaded.",
    category: "business",
    keywords: [
      "qr code generator",
      "free qr code generator",
      "url qr code generator",
      "wifi qr code generator",
      "vcard qr code generator",
      "qr code",
      "qr",
      "wifi qr",
      "vcard qr",
      "static qr code",
    ],
    popular: true,
    related: ["email-signature-generator", "digital-business-card"],
    capabilities: ["copy", "clear", "download"],
  },
  {
    slug: "invoice-generator",
    name: "Invoice Generator",
    title: "Free Invoice Generator — Print & PDF Invoices in Your Browser",
    h1: "Invoice Generator",
    description:
      "Create a professional invoice in your browser. Add line items, tax, discounts, and a logo, then print or download a PDF. Nothing is uploaded.",
    category: "business",
    keywords: [
      "invoice generator",
      "free invoice generator",
      "invoice pdf",
      "create invoice",
      "freelance invoice",
      "invoice template",
    ],
    popular: true,
    related: ["email-signature-generator", "qr-code-generator"],
    capabilities: ["copy", "clear", "download"],
  },
  {
    slug: "digital-business-card",
    name: "Digital Business Card",
    title: "Free Digital Business Card Generator — vCard, PNG & QR",
    h1: "Digital Business Card Generator",
    description:
      "Build a digital business card in your browser. Download a vCard, export a PNG, and include a static contact QR. Nothing is hosted or uploaded.",
    category: "business",
    keywords: [
      "digital business card",
      "digital business card generator",
      "vcard generator",
      "contact card",
      "business card qr",
      "vcf",
    ],
    popular: true,
    related: ["email-signature-generator", "qr-code-generator"],
    capabilities: ["copy", "clear", "download"],
  },
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    title: "Merge PDF Online Free — Combine PDF Files | InfyraTools",
    h1: "Merge PDF",
    description:
      "Combine multiple PDF files into one document in your browser. Reorder files, then download. Nothing is uploaded.",
    category: "pdf",
    keywords: [
      "merge pdf",
      "combine pdf",
      "merge pdf online free",
      "join pdf",
      "pdf merger",
    ],
    popular: true,
    related: ["split-pdf", "rotate-pdf", "jpg-to-pdf"],
    capabilities: ["download", "clear"],
  },
  {
    slug: "split-pdf",
    name: "Split PDF",
    title: "Split PDF Online Free — Extract PDF Pages | InfyraTools",
    h1: "Split PDF",
    description:
      "Extract selected PDF pages or download pages as separate files. Choose pages or ranges in your browser. Nothing is uploaded.",
    category: "pdf",
    keywords: [
      "split pdf",
      "extract pdf pages",
      "split pdf online free",
      "pdf page extractor",
      "pdf splitter",
    ],
    popular: true,
    related: ["merge-pdf", "pdf-to-jpg", "rotate-pdf"],
    capabilities: ["download", "clear"],
  },
  {
    slug: "jpg-to-pdf",
    name: "JPG to PDF",
    title: "JPG to PDF Converter Online Free | InfyraTools",
    h1: "JPG to PDF",
    description:
      "Convert JPG and PNG images into a PDF in your browser. Reorder images, choose page size, and download. Nothing is uploaded.",
    category: "pdf",
    keywords: [
      "jpg to pdf",
      "jpeg to pdf",
      "png to pdf",
      "image to pdf",
      "jpg to pdf converter online free",
    ],
    popular: true,
    related: ["pdf-to-jpg", "merge-pdf", "rotate-pdf"],
    capabilities: ["download", "clear"],
  },
  {
    slug: "pdf-to-jpg",
    name: "PDF to JPG",
    title: "PDF to JPG Converter Online Free | InfyraTools",
    h1: "PDF to JPG",
    description:
      "Convert PDF pages into JPG images in your browser. Download one image or a ZIP of selected pages. Nothing is uploaded.",
    category: "pdf",
    keywords: [
      "pdf to jpg",
      "pdf to jpeg",
      "pdf to image",
      "pdf to jpg converter online free",
      "convert pdf pages",
    ],
    popular: true,
    related: ["jpg-to-pdf", "split-pdf", "rotate-pdf"],
    capabilities: ["download", "clear"],
  },
  {
    slug: "rotate-pdf",
    name: "Rotate PDF",
    title: "Rotate PDF Online Free — Rotate PDF Pages | InfyraTools",
    h1: "Rotate PDF",
    description:
      "Rotate individual PDF pages or the whole document in your browser. Preview changes, then download. Nothing is uploaded.",
    category: "pdf",
    keywords: [
      "rotate pdf",
      "rotate pdf pages",
      "rotate pdf online free",
      "pdf rotator",
      "fix pdf pages",
    ],
    popular: true,
    related: ["merge-pdf", "split-pdf", "organize-pdf"],
    capabilities: ["download", "clear"],
  },
  {
    slug: "organize-pdf",
    name: "PDF Page Organizer",
    title: "Organize PDF Pages Online Free | InfyraTools",
    h1: "PDF Page Organizer",
    description:
      "Reorder, delete, duplicate, and rotate PDF pages online for free. Organize your PDF locally in your browser without uploading files.",
    category: "pdf",
    keywords: [
      "organize pdf",
      "reorder pdf pages",
      "delete pdf pages",
      "duplicate pdf pages",
      "pdf page organizer",
    ],
    popular: true,
    related: ["rotate-pdf", "split-pdf", "merge-pdf"],
    capabilities: ["download", "clear"],
  },
  {
    slug: "watermark-pdf",
    name: "Add Watermark to PDF",
    title: "Add Watermark to PDF Online Free | InfyraTools",
    h1: "Add Watermark to PDF",
    description:
      "Add text or image watermarks to PDF files for free. Customize opacity, size, rotation, and position directly in your browser.",
    category: "pdf",
    keywords: [
      "watermark pdf",
      "add watermark to pdf",
      "pdf stamp",
      "confidential pdf",
      "watermark pdf online free",
    ],
    popular: true,
    related: ["sign-pdf", "organize-pdf", "merge-pdf"],
    capabilities: ["download", "clear"],
  },
  {
    slug: "sign-pdf",
    name: "Sign PDF",
    title: "Sign PDF Online Free — Add Signature to PDF | InfyraTools",
    h1: "Sign PDF",
    description:
      "Draw, type, or upload a signature and place it on a PDF online for free. Sign documents locally without uploading your files.",
    category: "pdf",
    keywords: [
      "sign pdf",
      "pdf signature",
      "add signature to pdf",
      "electronic signature",
      "sign pdf online free",
    ],
    popular: true,
    related: ["watermark-pdf", "organize-pdf", "pdf-to-jpg"],
    capabilities: ["download", "clear"],
  },
  {
    slug: "image-compressor",
    name: "Image Compressor",
    title: "Compress Images Online Free — JPG, PNG, WebP | InfyraTools",
    h1: "Image Compressor",
    description:
      "Compress JPG, PNG, and WebP images online for free. Reduce image sizes locally in your browser without uploading files.",
    category: "images",
    keywords: [
      "compress image",
      "image compressor",
      "compress jpg",
      "compress png",
      "compress webp",
    ],
    popular: true,
    related: ["image-resizer", "jpg-to-pdf", "pdf-to-jpg"],
    capabilities: ["download", "clear"],
  },
  {
    slug: "image-resizer",
    name: "Image Resizer",
    title: "Resize Images Online Free — JPG, PNG, WebP | InfyraTools",
    h1: "Image Resizer",
    description:
      "Resize JPG, PNG, and WebP images online for free. Adjust dimensions, aspect ratio, and output format directly in your browser.",
    category: "images",
    keywords: [
      "resize image",
      "image resizer",
      "resize jpg",
      "change image size",
      "image dimensions",
    ],
    popular: true,
    related: ["image-compressor", "jpg-to-pdf", "pdf-to-jpg"],
    capabilities: ["download", "clear"],
  },
] as const;

const toolsBySlug = new Map<ToolSlug, Tool>(
  TOOLS.map((tool) => [tool.slug, tool]),
);

const categoriesById = new Map<CategoryId, Category>(
  CATEGORIES.map((category) => [category.id, category]),
);

export function getToolBySlug(slug: string): Tool | undefined {
  return toolsBySlug.get(slug as ToolSlug);
}

export function getAllTools(): readonly Tool[] {
  return TOOLS;
}

export function getPopularTools(): Tool[] {
  return TOOLS.filter((tool) => tool.popular);
}

export function getCategory(id: CategoryId): Category | undefined {
  return categoriesById.get(id);
}

export function getToolsByCategory(id: CategoryId): Tool[] {
  return TOOLS.filter((tool) => tool.category === id);
}

export function getRelatedTools(tool: Tool): Tool[] {
  return tool.related
    .map((slug) => toolsBySlug.get(slug))
    .filter((related): related is Tool => related !== undefined);
}

export function searchTools(
  query: string,
  tools: readonly Tool[] = TOOLS,
): Tool[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [...tools];
  }

  return tools.filter((tool) => {
    const category = getCategory(tool.category);
    const haystack = [
      tool.name,
      tool.h1,
      tool.description,
      tool.category,
      category?.label ?? "",
      ...tool.keywords,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}
