import {
  DEFAULT_BACKGROUND,
  DEFAULT_FOREGROUND,
  LOGO_SIZE_RATIO,
} from "./constants";
import { buildQrPayload, colorWarnings } from "./payload";
import {
  sanitizeColor,
  sanitizeDataImageUrl,
  sanitizeErrorCorrection,
  sanitizeQrMargin,
  sanitizeQrSize,
} from "./sanitize";
import { QR_GENERATION_MODE } from "./types";
import type { QrErrorCorrection, QrInput, QrRenderResult, QrStyle } from "./types";

type QrCodeApi = {
  toDataURL: (
    text: string,
    options?: {
      errorCorrectionLevel?: QrErrorCorrection;
      margin?: number;
      width?: number;
      color?: { dark: string; light: string };
    },
  ) => Promise<string>;
  toString: (
    text: string,
    options?: {
      type?: "svg";
      errorCorrectionLevel?: QrErrorCorrection;
      margin?: number;
      width?: number;
      color?: { dark: string; light: string };
    },
  ) => Promise<string>;
};

async function loadQrcode(): Promise<QrCodeApi> {
  const qrcodeModule = await import("qrcode");
  const candidate = qrcodeModule as unknown as QrCodeApi & { default?: QrCodeApi };
  if (typeof candidate.toDataURL === "function") {
    return candidate;
  }
  if (candidate.default && typeof candidate.default.toDataURL === "function") {
    return candidate.default;
  }
  throw new Error("The QR library did not load.");
}

export function effectiveErrorCorrection(
  style: QrStyle,
  hasLogo: boolean,
): QrErrorCorrection {
  if (hasLogo) {
    return "H";
  }

  return sanitizeErrorCorrection(style.errorCorrection);
}

function rendererOptions(style: QrStyle, errorCorrection: QrErrorCorrection) {
  const size = sanitizeQrSize(style.size);
  const margin = sanitizeQrMargin(style.margin);
  const foreground = sanitizeColor(style.foreground, DEFAULT_FOREGROUND);
  const background = sanitizeColor(style.background, DEFAULT_BACKGROUND);

  return {
    errorCorrectionLevel: errorCorrection,
    margin,
    width: size,
    color: {
      dark: foreground,
      light: background,
    },
  };
}

function escapeXmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

export function overlayLogoOnSvg(svg: string, logoDataUrl: string): string {
  const logo = sanitizeDataImageUrl(logoDataUrl);

  if (!logo) {
    return svg;
  }

  const viewBox = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const dim = viewBox ? Number(viewBox[1]) : sanitizeQrSize(280);
  const logoSize = dim * LOGO_SIZE_RATIO;
  const pad = dim * 0.02;
  const box = logoSize + pad * 2;
  const origin = (dim - box) / 2;
  const imageOrigin = origin + pad;
  const href = escapeXmlAttribute(logo);

  const overlay = [
    `<rect x="${origin.toFixed(3)}" y="${origin.toFixed(3)}" width="${box.toFixed(3)}" height="${box.toFixed(3)}" fill="#ffffff"/>`,
    `<image href="${href}" x="${imageOrigin.toFixed(3)}" y="${imageOrigin.toFixed(3)}" width="${logoSize.toFixed(3)}" height="${logoSize.toFixed(3)}" preserveAspectRatio="xMidYMid meet"/>`,
  ].join("");

  return svg.replace("</svg>", `${overlay}</svg>`);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The logo image could not be read."));
    image.src = src;
  });
}

export async function overlayLogoOnPng(
  pngDataUrl: string,
  logoDataUrl: string,
  size: number,
): Promise<string> {
  if (typeof document === "undefined") {
    return pngDataUrl;
  }

  const logo = sanitizeDataImageUrl(logoDataUrl);

  if (!logo) {
    return pngDataUrl;
  }

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  if (!context) {
    return pngDataUrl;
  }

  const qrImage = await loadImage(pngDataUrl);
  context.drawImage(qrImage, 0, 0, size, size);

  const logoPx = Math.round(size * LOGO_SIZE_RATIO);
  const pad = Math.max(2, Math.round(size * 0.02));
  const box = logoPx + pad * 2;
  const origin = Math.round((size - box) / 2);

  context.fillStyle = "#ffffff";
  context.fillRect(origin, origin, box, box);

  const logoImage = await loadImage(logo);
  context.drawImage(logoImage, origin + pad, origin + pad, logoPx, logoPx);

  return canvas.toDataURL("image/png");
}

export async function renderStaticQr(input: QrInput): Promise<QrRenderResult> {
  const payloadResult = buildQrPayload(input.type, input.fields);

  if (!payloadResult.ok) {
    return payloadResult;
  }

  const hasLogo = Boolean(input.logoDataUrl);
  const logo = hasLogo ? sanitizeDataImageUrl(input.logoDataUrl ?? "") : null;

  if (hasLogo && !logo) {
    return {
      ok: false,
      message:
        "Use a PNG, JPEG, GIF, or WebP logo under 200 KB. Other image types are not embedded.",
    };
  }

  const errorCorrection = effectiveErrorCorrection(input.style, Boolean(logo));
  const options = rendererOptions(input.style, errorCorrection);
  const warnings = [
    ...payloadResult.warnings,
    ...colorWarnings(options.color.dark, options.color.light),
  ];

  if (logo && input.style.errorCorrection !== "H") {
    warnings.push(
      "A center logo needs high error correction, so level H is used for this QR code.",
    );
  }

  if (options.margin === 0) {
    warnings.push("A zero margin can make scanning unreliable. A quiet zone of 2 or more is safer.");
  }

  try {
    const qrcode = await loadQrcode();
    let pngDataUrl = await qrcode.toDataURL(payloadResult.payload, options);
    let svg = await qrcode.toString(payloadResult.payload, {
      ...options,
      type: "svg",
    });

    if (logo) {
      svg = overlayLogoOnSvg(svg, logo);
      pngDataUrl = await overlayLogoOnPng(pngDataUrl, logo, options.width);
    }

    return {
      ok: true,
      payload: payloadResult.payload,
      pngDataUrl,
      svg,
      warnings,
      errorCorrection,
      mode: QR_GENERATION_MODE,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The QR code could not be generated.";

    return {
      ok: false,
      message: `${message} Try shorter content or a higher error-correction level.`,
    };
  }
}
