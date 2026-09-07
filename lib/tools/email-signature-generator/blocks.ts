import { anchor, css, imageTag, styledText, table, td, tr } from "./markup";
import type { SanitizedSignature } from "./types";

export function fontStyle(
  ctx: SanitizedSignature,
  extra: Record<string, string | number | undefined> = {},
): string {
  return css({
    "font-family": ctx.fontFamily,
    "font-size": `${ctx.fontSize}px`,
    "line-height": "1.45",
    color: ctx.textColor,
    ...extra,
  });
}

export function smallStyle(
  ctx: SanitizedSignature,
  extra: Record<string, string | number | undefined> = {},
): string {
  return css({
    "font-family": ctx.fontFamily,
    "font-size": `${ctx.smallSize}px`,
    "line-height": "1.4",
    color: ctx.mutedColor,
    ...extra,
  });
}

export function linkStyle(ctx: SanitizedSignature, color = ctx.accentColor): string {
  return css({
    "font-family": ctx.fontFamily,
    "font-size": `${ctx.smallSize}px`,
    color,
    "text-decoration": "none",
  });
}

export function nameBlock(ctx: SanitizedSignature, size = ctx.fontSize + 4): string {
  if (!ctx.fullName) {
    return "";
  }

  return styledText(
    ctx.fullName,
    fontStyle(ctx, {
      "font-size": `${size}px`,
      "font-weight": "700",
      "line-height": "1.25",
      color: ctx.textColor,
    }),
  );
}

export function titleCompany(ctx: SanitizedSignature): string {
  const parts = [ctx.jobTitle, ctx.company].filter(Boolean) as string[];

  if (parts.length === 0) {
    return "";
  }

  return styledText(parts.join(" · "), smallStyle(ctx));
}

export function contactLines(ctx: SanitizedSignature): string[] {
  const lines: string[] = [];

  if (ctx.email && ctx.emailHref) {
    lines.push(anchor(ctx.emailHref, ctx.email, linkStyle(ctx)));
  }

  if (ctx.phone && ctx.phoneHref) {
    lines.push(anchor(ctx.phoneHref, ctx.phone, linkStyle(ctx, ctx.textColor)));
  }

  if (ctx.websiteHref && ctx.websiteLabel) {
    lines.push(anchor(ctx.websiteHref, ctx.websiteLabel, linkStyle(ctx)));
  }

  if (ctx.address) {
    lines.push(styledText(ctx.address, smallStyle(ctx)));
  }

  return lines;
}

export function stackedLines(lines: string[]): string {
  return lines.filter(Boolean).join("<br />");
}

export function socialRow(ctx: SanitizedSignature): string {
  if (!ctx.showSocial) {
    return "";
  }

  const links = ctx.socials.map((social, index) => {
    const prefix = index === 0 ? "" : styledText(" · ", smallStyle(ctx));
    return `${prefix}${anchor(social.href, social.label, linkStyle(ctx))}`;
  });

  return links.join("");
}

export function photoCell(ctx: SanitizedSignature, size = 72): string {
  if (!ctx.showPhoto || !ctx.photoSrc) {
    return "";
  }

  return td(
    imageTag(ctx.photoSrc, ctx.fullName ?? "Profile photo", size, size, "border-radius:8px;"),
    {
      valign: "top",
      width: size,
      style: css({
        width: `${size}px`,
        padding: "0 16px 0 0",
      }),
    },
  );
}

export function logoImage(
  ctx: SanitizedSignature,
  width = 120,
  height = 36,
): string {
  if (!ctx.showLogo || !ctx.logoSrc) {
    return "";
  }

  return imageTag(ctx.logoSrc, ctx.company ?? "Company logo", width, height);
}

export function logoRow(ctx: SanitizedSignature, width = 120, height = 36): string {
  const logo = logoImage(ctx, width, height);

  if (!logo) {
    return "";
  }

  return tr(
    td(logo, {
      style: css({ padding: "0 0 10px 0" }),
    }),
  );
}

export function dividerRow(ctx: SanitizedSignature, colspan = 1): string {
  if (!ctx.showDivider) {
    return "";
  }

  return tr(
    td("", {
      colspan,
      height: 1,
      bgcolor: ctx.accentColor,
      style: css({
        height: "2px",
        "line-height": "2px",
        "font-size": "0",
        "background-color": ctx.accentColor,
        padding: "0",
      }),
    }),
  );
}

export function wrapSignature(inner: string, ctx: SanitizedSignature): string {
  return table(
    inner,
    css({
      "font-family": ctx.fontFamily,
      "font-size": `${ctx.fontSize}px`,
      color: ctx.textColor,
      "max-width": "560px",
    }),
  );
}
