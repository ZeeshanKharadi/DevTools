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
const EmailSignatureTool = dynamic(
  () =>
    import("@/components/email-signature-generator/EmailSignatureTool"),
);
const QrCodeTool = dynamic(
  () => import("@/components/qr-code-generator/QrCodeTool"),
);
const InvoiceTool = dynamic(
  () => import("@/components/invoice-generator/InvoiceTool"),
);
const DigitalBusinessCardTool = dynamic(
  () => import("@/components/digital-business-card/DigitalBusinessCardTool"),
);
const MergePdfTool = dynamic(() => import("@/components/merge-pdf/MergePdfTool"));
const SplitPdfTool = dynamic(() => import("@/components/split-pdf/SplitPdfTool"));
const JpgToPdfTool = dynamic(() => import("@/components/jpg-to-pdf/JpgToPdfTool"));
const PdfToJpgTool = dynamic(() => import("@/components/pdf-to-jpg/PdfToJpgTool"));
const RotatePdfTool = dynamic(
  () => import("@/components/rotate-pdf/RotatePdfTool"),
);
const OrganizePdfTool = dynamic(
  () => import("@/components/organize-pdf/OrganizePdfTool"),
);
const WatermarkPdfTool = dynamic(
  () => import("@/components/watermark-pdf/WatermarkPdfTool"),
);
const SignPdfTool = dynamic(() => import("@/components/sign-pdf/SignPdfTool"));
const ImageCompressorTool = dynamic(
  () => import("@/components/image-compressor/ImageCompressorTool"),
);
const ImageResizerTool = dynamic(
  () => import("@/components/image-resizer/ImageResizerTool"),
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
    case "email-signature-generator":
      return <EmailSignatureTool />;
    case "qr-code-generator":
      return <QrCodeTool />;
    case "invoice-generator":
      return <InvoiceTool />;
    case "digital-business-card":
      return <DigitalBusinessCardTool />;
    case "merge-pdf":
      return <MergePdfTool />;
    case "split-pdf":
      return <SplitPdfTool />;
    case "jpg-to-pdf":
      return <JpgToPdfTool />;
    case "pdf-to-jpg":
      return <PdfToJpgTool />;
    case "rotate-pdf":
      return <RotatePdfTool />;
    case "organize-pdf":
      return <OrganizePdfTool />;
    case "watermark-pdf":
      return <WatermarkPdfTool />;
    case "sign-pdf":
      return <SignPdfTool />;
    case "image-compressor":
      return <ImageCompressorTool />;
    case "image-resizer":
      return <ImageResizerTool />;
    default: {
      const exhaustive: never = tool.slug;
      throw new Error(`No workspace for ${exhaustive}`);
    }
  }
}
