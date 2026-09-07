import { escapeAttribute, escapeHtml } from "./sanitize";

type CellAttrs = {
  style?: string;
  width?: string | number;
  height?: string | number;
  valign?: "top" | "middle" | "bottom";
  align?: "left" | "center" | "right";
  colspan?: number;
  bgcolor?: string;
};

export function css(parts: Record<string, string | number | undefined>): string {
  return Object.entries(parts)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
}

export function table(inner: string, style = "", extra = ""): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"${extra} style="border-collapse:collapse;border-spacing:0;${style}">${inner}</table>`;
}

export function tr(inner: string): string {
  return `<tr>${inner}</tr>`;
}

export function td(inner: string, attrs: CellAttrs = {}): string {
  const bits = [
    attrs.valign ? ` valign="${attrs.valign}"` : "",
    attrs.align ? ` align="${attrs.align}"` : "",
    attrs.width !== undefined ? ` width="${attrs.width}"` : "",
    attrs.height !== undefined ? ` height="${attrs.height}"` : "",
    attrs.colspan ? ` colspan="${attrs.colspan}"` : "",
    attrs.bgcolor ? ` bgcolor="${escapeAttribute(attrs.bgcolor)}"` : "",
    attrs.style ? ` style="${escapeAttribute(attrs.style)}"` : "",
  ];

  return `<td${bits.join("")}>${inner}</td>`;
}

export function styledText(value: string, style: string): string {
  return `<span style="${escapeAttribute(style)}">${escapeHtml(value)}</span>`;
}

export function anchor(href: string, label: string, style: string): string {
  const extra = href.startsWith("http")
    ? ' target="_blank" rel="noopener noreferrer"'
    : "";

  return `<a href="${escapeAttribute(href)}" style="${escapeAttribute(style)}"${extra}>${escapeHtml(label)}</a>`;
}

export function imageTag(
  src: string,
  alt: string,
  width: number,
  height: number,
  extraStyle = "",
): string {
  return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}" width="${width}" height="${height}" style="display:block;border:0;outline:none;text-decoration:none;${extraStyle}" />`;
}
