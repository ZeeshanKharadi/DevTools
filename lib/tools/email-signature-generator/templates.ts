import {
  contactLines,
  dividerRow,
  fontStyle,
  logoImage,
  logoRow,
  nameBlock,
  photoCell,
  smallStyle,
  socialRow,
  stackedLines,
  titleCompany,
  wrapSignature,
} from "./blocks";
import { anchor, css, imageTag, styledText, table, td, tr } from "./markup";
import type { SanitizedSignature } from "./types";

function detailsStack(ctx: SanitizedSignature, nameSize?: number): string {
  return stackedLines(
    [
      nameBlock(ctx, nameSize),
      titleCompany(ctx),
      stackedLines(contactLines(ctx)),
      socialRow(ctx),
    ].filter(Boolean),
  );
}

export function renderMinimal(ctx: SanitizedSignature): string {
  const rows: string[] = [];

  if (ctx.showLogo) {
    rows.push(logoRow(ctx));
  }

  if (ctx.showDivider) {
    rows.push(dividerRow(ctx, ctx.showPhoto ? 2 : 1));
  }

  rows.push(
    tr(
      `${photoCell(ctx, 64)}${td(detailsStack(ctx, ctx.fontSize + 2), {
        valign: "top",
        style: css({ padding: ctx.showDivider ? "10px 0 0 0" : "0" }),
      })}`,
    ),
  );

  return wrapSignature(rows.join(""), ctx);
}

export function renderCorporate(ctx: SanitizedSignature): string {
  const inner = table(
    tr(
      `${photoCell(ctx, 80)}${td(detailsStack(ctx), {
        valign: "top",
        style: css({ padding: "0" }),
      })}`,
    ),
  );

  const accent = td("&nbsp;", {
    width: 4,
    bgcolor: ctx.accentColor,
    style: css({
      width: "4px",
      "background-color": ctx.accentColor,
      padding: "0",
      "font-size": "0",
      "line-height": "0",
    }),
  });

  const rows = [
    ctx.showLogo
      ? tr(
          td(logoImage(ctx, 120, 36), {
            colspan: 2,
            style: css({ padding: "0 0 12px 0" }),
          }),
        )
      : "",
    tr(
      `${accent}${td(inner, {
        valign: "top",
        style: css({ padding: "0 0 0 14px" }),
      })}`,
    ),
  ];

  return wrapSignature(rows.join(""), ctx);
}

export function renderModern(ctx: SanitizedSignature): string {
  const underline = ctx.showDivider
    ? table(
        tr(
          td("&nbsp;", {
            height: 3,
            width: 48,
            bgcolor: ctx.accentColor,
            style: css({
              height: "3px",
              width: "48px",
              "background-color": ctx.accentColor,
              "font-size": "0",
              "line-height": "0",
            }),
          }),
        ),
        css({ "margin-top": "8px", "margin-bottom": "10px" }),
      )
    : "";

  const copy = stackedLines(
    [nameBlock(ctx, ctx.fontSize + 6), underline, titleCompany(ctx), stackedLines(contactLines(ctx))].filter(
      Boolean,
    ),
  );

  const rows = [
    ctx.showLogo ? logoRow(ctx) : "",
    tr(`${photoCell(ctx, 88)}${td(copy, { valign: "top" })}`),
    ctx.showSocial
      ? tr(
          td(socialRow(ctx), {
            colspan: ctx.showPhoto ? 2 : 1,
            style: css({ padding: "12px 0 0 0" }),
          }),
        )
      : "",
  ];

  return wrapSignature(rows.join(""), ctx);
}

export function renderCompact(ctx: SanitizedSignature): string {
  const headline = [ctx.fullName, ctx.jobTitle, ctx.company]
    .filter(Boolean)
    .join(" | ");

  const contacts = [
    ctx.email && ctx.emailHref
      ? anchor(ctx.emailHref, ctx.email, smallStyle(ctx, { color: ctx.accentColor, "text-decoration": "none" }))
      : "",
    ctx.phone && ctx.phoneHref
      ? anchor(ctx.phoneHref, ctx.phone, smallStyle(ctx, { color: ctx.textColor, "text-decoration": "none" }))
      : "",
    ctx.websiteHref && ctx.websiteLabel
      ? anchor(
          ctx.websiteHref,
          ctx.websiteLabel,
          smallStyle(ctx, { color: ctx.accentColor, "text-decoration": "none" }),
        )
      : "",
  ].filter(Boolean);

  const copy = stackedLines(
    [
      headline
        ? styledText(
            headline,
            fontStyle(ctx, {
              "font-weight": "700",
              "font-size": `${ctx.fontSize}px`,
            }),
          )
        : "",
      contacts.join(styledText(" · ", smallStyle(ctx))),
      ctx.address ? styledText(ctx.address, smallStyle(ctx)) : "",
      socialRow(ctx),
    ].filter(Boolean),
  );

  const photo = photoCell(ctx, 52);

  return wrapSignature(
    `${ctx.showLogo ? logoRow(ctx) : ""}${ctx.showDivider ? dividerRow(ctx, photo ? 2 : 1) : ""}${tr(
      `${photo}${td(copy, {
        valign: "middle",
        style: css({ padding: photo ? "0" : "6px 0" }),
      })}`,
    )}`,
    ctx,
  );
}

export function renderExecutive(ctx: SanitizedSignature): string {
  const logo = ctx.showLogo && ctx.logoSrc
    ? imageTag(ctx.logoSrc, ctx.company ?? "Company logo", 140, 42, "margin-bottom:12px;")
    : "";

  const header = stackedLines(
    [logo, nameBlock(ctx, ctx.fontSize + 8), titleCompany(ctx)].filter(Boolean),
  );

  const photo =
    ctx.showPhoto && ctx.photoSrc
      ? imageTag(ctx.photoSrc, ctx.fullName ?? "Profile photo", 64, 64, "border-radius:8px;")
      : "";

  return wrapSignature(
    `${tr(td(header, { style: css({ padding: "0 0 8px 0" }) }))}${dividerRow(ctx)}${tr(
      td(stackedLines(contactLines(ctx)), {
        style: css({ padding: "10px 0 0 0" }),
      }),
    )}${
      ctx.showSocial
        ? tr(td(socialRow(ctx), { style: css({ padding: "10px 0 0 0" }) }))
        : ""
    }${photo ? tr(td(photo, { style: css({ padding: "12px 0 0 0" }) })) : ""}`,
    ctx,
  );
}
