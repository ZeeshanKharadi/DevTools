export {
  DEFAULT_ACCENT_COLOR,
  DEFAULT_OPTIONS,
  DEFAULT_TEXT_COLOR,
  EMPTY_FIELDS,
  EMPTY_IMAGE,
  EMPTY_INPUT,
  EXAMPLE_FIELDS,
  EXAMPLE_INPUT,
  FONT_SIZE_PX,
  FONT_STACKS,
  MAX_IMAGE_BYTES,
  SOCIAL_LABELS,
  TEMPLATE_META,
} from "./constants";
export {
  EMAIL_SAFE_FONTS,
  FONT_SIZES,
  SIGNATURE_TEMPLATES,
  SOCIAL_NETWORKS,
} from "./types";
export { copyRichHtml, isSignatureTemplateId, renderSignature } from "./render";
export {
  escapeHtml,
  sanitizeColor,
  sanitizeEmail,
  sanitizeHttpUrl,
  sanitizeImageSrc,
  sanitizePhone,
} from "./sanitize";
export { prepareSignature } from "./prepare";
export type {
  EmailSafeFont,
  ImageOrigin,
  SignatureFields,
  SignatureFontSize,
  SignatureImage,
  SignatureInput,
  SignatureOptions,
  SignatureRenderResult,
  SignatureTemplateId,
  SocialNetwork,
} from "./types";
