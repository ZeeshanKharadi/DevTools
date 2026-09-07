import { FONT_STACKS } from "./constants";
import { prepareCard } from "./prepare";
import type { CardInput } from "./types";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read an image for export."));
    image.src = src;
  });
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const tokens = text.split(/\s+/).flatMap((word) => {
    if (context.measureText(word).width <= maxWidth) {
      return [word];
    }
    const parts: string[] = [];
    let chunk = "";
    for (const char of word) {
      const next = chunk + char;
      if (chunk && context.measureText(next).width > maxWidth) {
        parts.push(chunk);
        chunk = char;
      } else {
        chunk = next;
      }
    }
    if (chunk) {
      parts.push(chunk);
    }
    return parts;
  });

  let line = "";
  let row = 0;
  let cursor = y;

  for (const word of tokens) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width > maxWidth && line) {
      context.fillText(line, x, cursor);
      line = word;
      cursor += lineHeight;
      row += 1;
      if (row >= maxLines) {
        return;
      }
    } else {
      line = next;
    }
  }
  if (line && row < maxLines) {
    context.fillText(line, x, cursor);
  }
}

export async function renderCardPng(
  input: CardInput,
  qrPngDataUrl: string | null,
): Promise<string> {
  if (typeof document === "undefined") {
    throw new Error("Card images can only be exported in the browser.");
  }

  const card = prepareCard(input);
  const width = card.template === "compact" ? 1200 : 1080;
  const height = card.template === "compact" ? 520 : 640;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create an image canvas.");
  }

  ctx.fillStyle = card.backgroundColor;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = card.accentColor;
  if (card.template === "bold") {
    ctx.fillRect(0, 0, 28, height);
  } else if (card.template === "corporate") {
    ctx.fillRect(0, 0, width, 12);
  } else if (card.template === "compact") {
    ctx.fillRect(0, 0, 16, height);
  } else {
    ctx.fillRect(0, height - 10, width, 10);
  }

  ctx.fillStyle = card.textColor;
  ctx.font = `600 40px ${FONT_STACKS[card.font]}`;
  const nameX = card.template === "corporate" && card.showPhoto ? 280 : 56;
  const textWidth = width - nameX - (card.showQr ? 220 : 56);
  wrapText(
    ctx,
    card.fullName || "Your name",
    nameX,
    card.template === "compact" ? 90 : 120,
    textWidth,
    44,
    2,
  );

  ctx.font = `400 22px ${FONT_STACKS[card.font]}`;
  const subtitle = [card.jobTitle, card.company].filter(Boolean).join(" · ");
  if (subtitle) {
    wrapText(
      ctx,
      subtitle,
      nameX,
      card.template === "compact" ? 130 : 168,
      textWidth,
      26,
      2,
    );
  }

  ctx.font = `400 18px ${FONT_STACKS[card.font]}`;
  const details = [card.phone, card.email, card.websiteHref, card.address].filter(
    (value): value is string => Boolean(value),
  );
  let detailY = card.template === "compact" ? 180 : 230;
  details.forEach((line) => {
    wrapText(ctx, line, nameX, detailY, textWidth, 22, 2);
    detailY += 28;
  });

  if (card.bio) {
    wrapText(
      ctx,
      card.bio,
      nameX,
      Math.max(detailY + 8, card.template === "compact" ? 320 : 380),
      textWidth,
      24,
      3,
    );
  }

  if (card.showPhoto && card.photoSrc) {
    try {
      const photo = await loadImage(card.photoSrc);
      const size = card.template === "compact" ? 120 : 180;
      ctx.save();
      ctx.beginPath();
      ctx.arc(56 + size / 2, 56 + size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(photo, 56, 56, size, size);
      ctx.restore();
    } catch {
      // Photo is optional on the PNG.
    }
  }

  if (card.showQr && qrPngDataUrl) {
    try {
      const qr = await loadImage(qrPngDataUrl);
      const size = 168;
      ctx.drawImage(qr, width - size - 40, height - size - 40, size, size);
    } catch {
      // QR is optional on the PNG.
    }
  }

  return canvas.toDataURL("image/png");
}
