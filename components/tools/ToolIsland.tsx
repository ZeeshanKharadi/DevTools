import dynamic from "next/dynamic";
import type { Tool } from "@/lib/tools/types";

const JsonFormatterTool = dynamic(
  () => import("@/components/json-formatter/JsonFormatterTool"),
);
const JsonValidatorTool = dynamic(
  () => import("@/components/json-validator/JsonValidatorTool"),
);
const JwtDecoderTool = dynamic(
  () => import("@/components/jwt-decoder/JwtDecoderTool"),
);
const Base64Tool = dynamic(() => import("@/components/base64/Base64Tool"));
const UrlEncoderTool = dynamic(
  () => import("@/components/url-encoder/UrlEncoderTool"),
);
const UuidGeneratorTool = dynamic(
  () => import("@/components/uuid-generator/UuidGeneratorTool"),
);
const UnixTimestampTool = dynamic(
  () => import("@/components/unix-timestamp/UnixTimestampTool"),
);
const CronGeneratorTool = dynamic(
  () => import("@/components/cron-generator/CronGeneratorTool"),
);
const RegexTesterTool = dynamic(
  () => import("@/components/regex-tester/RegexTesterTool"),
);
const SqlFormatterTool = dynamic(
  () => import("@/components/sql-formatter/SqlFormatterTool"),
);

type ToolIslandProps = {
  tool: Tool;
};

export function ToolIsland({ tool }: ToolIslandProps) {
  switch (tool.slug) {
    case "json-formatter":
      return <JsonFormatterTool />;
    case "json-validator":
      return <JsonValidatorTool />;
    case "jwt-decoder":
      return <JwtDecoderTool />;
    case "base64":
      return <Base64Tool />;
    case "url-encoder":
      return <UrlEncoderTool />;
    case "uuid-generator":
      return <UuidGeneratorTool />;
    case "unix-timestamp":
      return <UnixTimestampTool />;
    case "cron-generator":
      return <CronGeneratorTool />;
    case "regex-tester":
      return <RegexTesterTool />;
    case "sql-formatter":
      return <SqlFormatterTool />;
    default: {
      const exhaustive: never = tool.slug;
      throw new Error(`No workspace for ${exhaustive}`);
    }
  }
}
