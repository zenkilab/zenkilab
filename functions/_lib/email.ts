// Shared layout for the internal (business-facing) emails. Email clients ignore most CSS,
// so this is table layout with inline styles, one column, system fonts and no remote images.

/** Escape text for HTML. Every value that comes from a customer goes through this. */
export const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const C = {
  page: "#EEF0F3",
  card: "#FFFFFF",
  ink: "#15181D",
  muted: "#5B6470",
  line: "#E3E6EA",
  head: "#0B0D10",
  amber: "#F5A623",
  amberInk: "#7A4B00",
  amberBg: "#FFF6E5",
  cyanInk: "#0B5670",
  cyanBg: "#E6F7FD",
  okInk: "#14532D",
  okBg: "#E7F6EC",
  ok: "#1F9D55",
};

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'SFMono-Regular',Consolas,'Liberation Mono',monospace";

export type Tone = "info" | "ok";
export type Cell = string | { html: string };
const cell = (v: Cell) => (typeof v === "string" ? esc(v) : v.html);

/** Label and value rows, label muted on the left. Values are escaped unless passed as { html }. */
export function rows(pairs: [string, Cell][]) {
  const body = pairs
    .map(
      ([k, v]) =>
        `<tr><td style="padding:9px 0;border-bottom:1px solid ${C.line};color:${C.muted};font-size:13px;width:38%;vertical-align:top">${esc(k)}</td><td style="padding:9px 0;border-bottom:1px solid ${C.line};color:${C.ink};font-size:14px;vertical-align:top">${cell(v)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${body}</table>`;
}

export function section(label: string, inner: string) {
  return `<tr><td style="padding:22px 28px 0"><div style="font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:${C.muted};margin-bottom:6px">${esc(label)}</div>${inner}</td></tr>`;
}

export const mono = (s: string) => `<span style="font-family:${MONO}">${esc(s)}</span>`;

export function button(href: string, label: string) {
  return `<a href="${esc(href)}" style="display:inline-block;background:${C.amber};color:${C.head};font-weight:700;font-size:14px;text-decoration:none;padding:11px 18px;border-radius:8px">${esc(label)}</a>`;
}

/** Sri Lankan numbers are typed as 07x..., wa.me wants the country code and digits only. */
export function whatsappUrl(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length < 9) return null;
  const intl = d.startsWith("94") ? d : d.startsWith("0") ? "94" + d.slice(1) : d;
  return `https://wa.me/${intl}`;
}

export function callout(kind: "warn" | "info", title: string, text: string) {
  const [bg, ink, bar] = kind === "warn" ? [C.amberBg, C.amberInk, C.amber] : [C.cyanBg, C.cyanInk, "#38C8F5"];
  return `<tr><td style="padding:20px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border-left:4px solid ${bar};border-radius:6px"><tr><td style="padding:12px 14px;color:${ink};font-size:14px;line-height:1.5"><strong>${esc(title)}</strong><br>${esc(text)}</td></tr></table></td></tr>`;
}

export function shell(o: {
  kind: string; // small label in the header, e.g. "Key Tag" or "Project Quote"
  banner: string; // what this email is, in capitals
  tone: Tone;
  headline: string;
  sub: string;
  preheader: string;
  body: string; // <tr> rows built with section() and callout()
  footer: string;
}) {
  const [bg, ink] = o.tone === "ok" ? [C.okBg, C.okInk] : [C.cyanBg, C.cyanInk];
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:${C.page};font-family:${FONT}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.card};border-radius:14px;overflow:hidden;border:1px solid ${C.line}">
<tr><td style="background:${C.head};padding:16px 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font-size:18px;font-weight:700;color:#F3F5F7;letter-spacing:-.01em">Zenki<span style="color:${C.amber}">Lab</span></td>
<td align="right" style="font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#8A93A0">${esc(o.kind)} &middot; internal</td>
</tr></table></td></tr>
<tr><td style="background:${bg};padding:11px 28px;color:${ink};font-size:12px;font-weight:700;letter-spacing:.09em">${esc(o.banner)}</td></tr>
<tr><td style="padding:24px 28px 0"><h1 style="margin:0;font-size:24px;line-height:1.25;color:${C.ink}">${o.headline}</h1><p style="margin:6px 0 0;font-size:14px;color:${C.muted}">${o.sub}</p></td></tr>
${o.body}
<tr><td style="padding:26px 28px 24px"><div style="border-top:1px solid ${C.line};padding-top:14px;font-size:12px;color:${C.muted};line-height:1.5">${esc(o.footer)}</div></td></tr>
</table></td></tr></table></body></html>`;
}
