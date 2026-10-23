import type { ToolSlug } from "@/lib/tools/types";
import { base64Content } from "./base64";
import { cronGeneratorContent } from "./cron-generator";
import { digitalBusinessCardContent } from "./digital-business-card";
import { emailSignatureGeneratorContent } from "./email-signature-generator";
import { invoiceGeneratorContent } from "./invoice-generator";
import { imageCompressorContent } from "./image-compressor";
import { imageResizerContent } from "./image-resizer";
import { jpgToPdfContent } from "./jpg-to-pdf";
import { mergePdfContent } from "./merge-pdf";
import { organizePdfContent } from "./organize-pdf";
import { pdfToJpgContent } from "./pdf-to-jpg";
import { qrCodeGeneratorContent } from "./qr-code-generator";
import { jsonFormatterContent } from "./json-formatter";
import { jsonValidatorContent } from "./json-validator";
import { jwtDecoderContent } from "./jwt-decoder";
import { regexTesterContent } from "./regex-tester";
import { rotatePdfContent } from "./rotate-pdf";
import { signPdfContent } from "./sign-pdf";
import { splitPdfContent } from "./split-pdf";
import { sqlFormatterContent } from "./sql-formatter";
import { unixTimestampContent } from "./unix-timestamp";
import { urlEncoderContent } from "./url-encoder";
import { uuidGeneratorContent } from "./uuid-generator";
import { watermarkPdfContent } from "./watermark-pdf";
import type { ToolContent } from "./types";

const contentBySlug: Record<ToolSlug, ToolContent> = {
  "json-formatter": jsonFormatterContent,
  "json-validator": jsonValidatorContent,
  "jwt-decoder": jwtDecoderContent,
  base64: base64Content,
  "url-encoder": urlEncoderContent,
  "uuid-generator": uuidGeneratorContent,
  "unix-timestamp": unixTimestampContent,
  "cron-generator": cronGeneratorContent,
  "regex-tester": regexTesterContent,
  "sql-formatter": sqlFormatterContent,
  "email-signature-generator": emailSignatureGeneratorContent,
  "qr-code-generator": qrCodeGeneratorContent,
  "invoice-generator": invoiceGeneratorContent,
  "digital-business-card": digitalBusinessCardContent,
  "merge-pdf": mergePdfContent,
  "split-pdf": splitPdfContent,
  "jpg-to-pdf": jpgToPdfContent,
  "pdf-to-jpg": pdfToJpgContent,
  "rotate-pdf": rotatePdfContent,
  "organize-pdf": organizePdfContent,
  "watermark-pdf": watermarkPdfContent,
  "sign-pdf": signPdfContent,
  "image-compressor": imageCompressorContent,
  "image-resizer": imageResizerContent,
};

export function getToolContent(slug: ToolSlug): ToolContent {
  return contentBySlug[slug];
}
