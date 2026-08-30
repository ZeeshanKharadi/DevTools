export type CategoryId = "data" | "encoding" | "generators" | "time" | "text";

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
  | "cron-generator";

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
