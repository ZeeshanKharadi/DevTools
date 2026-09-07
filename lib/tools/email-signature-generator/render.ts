import { prepareSignature } from "./prepare";
import {
  renderCompact,
  renderCorporate,
  renderExecutive,
  renderMinimal,
  renderModern,
} from "./templates";
import {
  SIGNATURE_TEMPLATES,
  type SanitizedSignature,
  type SignatureInput,
  type SignatureRenderResult,
  type SignatureTemplateId,
} from "./types";

const renderers: Record<
  SignatureTemplateId,
  (ctx: SanitizedSignature) => string
> = {
  minimal: renderMinimal,
  corporate: renderCorporate,
  modern: renderModern,
  compact: renderCompact,
  executive: renderExecutive,
};

export function isSignatureTemplateId(value: string): value is SignatureTemplateId {
  return (SIGNATURE_TEMPLATES as readonly string[]).includes(value);
}

export function signaturePlainText(ctx: SanitizedSignature): string {
  const lines = [
    ctx.fullName,
    [ctx.jobTitle, ctx.company].filter(Boolean).join(" · ") || null,
    ctx.email,
    ctx.phone,
    ctx.websiteLabel,
    ctx.address,
    ctx.socials.map((social) => `${social.label}: ${social.href}`).join("\n") ||
      null,
  ].filter(Boolean);

  return lines.join("\n");
}

export function wrapSignatureDocument(html: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Email signature</title>
</head>
<body style="margin:0;padding:16px;background:#ffffff;">
${html}
</body>
</html>`;
}

export function collectImageWarnings(ctx: SanitizedSignature): string[] {
  const warnings: string[] = [];

  if (ctx.photoIsLocal || ctx.logoIsLocal) {
    warnings.push(
      "A local photo or logo is embedded as a data URL. Recipients of the email usually will not see it. Use a hosted https:// image URL if other people need to see the image.",
    );
  }

  return warnings;
}

export function renderSignature(input: SignatureInput): SignatureRenderResult {
  const ctx = prepareSignature(input);
  const html = renderers[ctx.template](ctx);
  const plainText = signaturePlainText(ctx);

  return {
    html,
    plainText,
    document: wrapSignatureDocument(html),
    warnings: collectImageWarnings(ctx),
  };
}

export async function copyRichHtml(
  html: string,
  plainText: string,
): Promise<void> {
  if (typeof ClipboardItem === "function" && navigator.clipboard.write) {
    const payload: Record<string, Blob> = {
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([plainText || html], { type: "text/plain" }),
    };

    await navigator.clipboard.write([new ClipboardItem(payload)]);
    return;
  }

  await navigator.clipboard.writeText(html);
}
