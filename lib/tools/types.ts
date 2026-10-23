export type CategoryId =
  | "data"
  | "encoding"
  | "generators"
  | "time"
  | "text"
  | "business"
  | "pdf"
  | "images";

export type ToolCapability = "copy" | "clear" | "paste" | "download" | "swap";

export type ToolSlug =
  | "json-formatter"
  | "json-validator"
  | "jwt-decoder"
  | "base64"
  | "url-encoder"
  | "uuid-generator"
  | "unix-timestamp"
  | "regex-tester"
  | "sql-formatter"
  | "cron-generator"
  | "email-signature-generator"
  | "qr-code-generator"
  | "invoice-generator"
  | "digital-business-card"
  | "merge-pdf"
  | "split-pdf"
  | "jpg-to-pdf"
  | "pdf-to-jpg"
  | "rotate-pdf"
  | "organize-pdf"
  | "watermark-pdf"
  | "sign-pdf"
  | "image-compressor"
  | "image-resizer";

export type Tool = {
  slug: ToolSlug;
  name: string;
  title: string;
  h1: string;
  description: string;
  category: CategoryId;
  keywords: string[];
  popular: boolean;
  related: ToolSlug[];
  capabilities: ToolCapability[];
};

export type Category = {
  id: CategoryId;
  label: string;
  description: string;
};
