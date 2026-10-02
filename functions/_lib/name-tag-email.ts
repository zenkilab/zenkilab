import { MATERIAL } from "../../src/lib/keytag";
import { ACCENTS, CONCEPTS, MAX_NAME, MAX_ROLE, MAX_STAFF, sanitizeLine, type ConceptId, type NameTagOrder } from "../../src/lib/name-tag";
import { C, button, esc, mono, rows, section, shell, whatsappUrl } from "./email";

const when = (t: number) =>
  new Date(t).toLocaleString("en-GB", { timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short" });

/** The order comes from a public form, so nothing in it is trusted: enums are checked and every text field is cleaned by the customizer's own rule. */
export function parseOrder(raw: string): NameTagOrder | null {
  try {
    const o = JSON.parse(raw);
    const c = o?.config;
    const concept: ConceptId | null = c?.concept === "A" || c?.concept === "B" ? c.concept : null;
    const accent = typeof c?.accent === "string" && /^#[0-9A-Fa-f]{6}$/.test(c.accent) ? c.accent : ACCENTS[0].hex;
    const font = typeof c?.font === "string" && /^[\p{L}\p{N} .-]{1,40}$/u.test(c.font) ? c.font : "Inter";
    const staff = Array.isArray(c?.staff)
      ? c.staff.slice(0, MAX_STAFF).map((s: { name?: unknown; role?: unknown }) => ({
          name: sanitizeLine(String(s?.name ?? ""), MAX_NAME).trim(),
          role: sanitizeLine(String(s?.role ?? ""), MAX_ROLE).trim(),
        }))
      : [];
    const createdAt = Number(o?.createdAt);
    if (!concept || staff.length === 0 || staff.some((s: { name: string }) => !s.name) || !/^NT-[A-Z0-9]{4,16}$/.test(o.orderId) || !Number.isFinite(createdAt)) return null;
    return {
      orderId: o.orderId,
      config: { concept, accent, font, logoName: String(c.logoName ?? "").slice(0, 80), staff },
      contact: { name: String(o.contact?.name ?? "").trim().slice(0, 80), phone: String(o.contact?.phone ?? "").trim().slice(0, 30) },
      createdAt,
    };
  } catch {
    return null;
  }
}

export function nameTagSpec(o: NameTagOrder, plates: number) {
  const { config: c, contact } = o;
  const k = CONCEPTS[c.concept];
  return [
    "NAME TAG ORDER, READY TO PRINT",
    `Order ID: ${o.orderId}`,
    `Customer: ${contact.name}`,
    `WhatsApp/phone: ${contact.phone}`,
    "",
    `Badges: ${c.staff.length} (${plates} plate${plates === 1 ? "" : "s"}, up to 12 per plate)`,
    `Design: ${c.concept} (${k.label}), ${k.w} x ${k.h} mm, 2.4 mm thick, 4 mm corners`,
    `Accent: ${c.accent}`,
    `Font: ${c.font}`,
    `Logo: ${c.logoName || "sample logo (none uploaded)"}`,
    `Material: ${MATERIAL}`,
    `Colours: slot 1 body ${k.solid}, slot 2 accent ${c.accent} (logo, rule), slot 3 lettering ${k.name}`,
    "Back: flat, no pin pockets. Glue or fit the pin-backs by hand, 44 mm apart on A, 34 mm apart on B.",
    "",
    "Staff:",
    ...c.staff.map((s, i) => `${i + 1}. ${s.name} - ${s.role || "(no role)"}`),
    "",
    "Check every name against the list above in Bambu Studio before printing.",
  ].join("\n");
}

const swatch = (hex: string) =>
  `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${hex};border:1px solid #C9CED6;vertical-align:-1px;margin-right:6px"></span>`;

export function nameTagEmail(o: NameTagOrder, plates: number, hasPreview: boolean) {
  const { config: c, contact } = o;
  const k = CONCEPTS[c.concept];
  const wa = whatsappUrl(contact.phone);
  const list = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.5;color:${C.ink}">${c.staff
    .map((s, i) => `<tr><td style="padding:3px 10px 3px 0;color:${C.muted};width:28px">${i + 1}</td><td style="padding:3px 0"><strong>${esc(s.name)}</strong> &nbsp;${esc(s.role)}</td></tr>`)
    .join("")}</table>`;

  const body = [
    hasPreview
      ? `<tr><td style="padding:20px 28px 0"><img src="cid:tag-preview" alt="Customer's name tag design" width="544" style="display:block;width:100%;max-width:544px;height:auto;border-radius:10px;border:1px solid ${C.line}"></td></tr>`
      : "",
    section(
      "What to print",
      rows([
        ["Badges", { html: `<strong>${c.staff.length}</strong> on ${plates} plate${plates === 1 ? "" : "s"}` }],
        ["Design", `${c.concept}, ${k.label}, ${k.w} x ${k.h} mm`],
        ["Colours", { html: `${swatch(k.solid)}Body (slot 1) &nbsp; ${swatch(c.accent)}Logo and rule (slot 2) &nbsp; ${swatch(k.name)}Lettering (slot 3)` }],
        ["Font", c.font],
        ["Logo file", c.logoName || "Sample logo, none uploaded"],
        ["Material", MATERIAL],
        ["Back", "Flat. Fit the pin-backs by hand."],
      ]),
    ),
    section("Staff", list),
    section(
      "Customer",
      rows([
        ["Name", contact.name || "-"],
        ["WhatsApp / phone", contact.phone || "-"],
      ]) + (wa ? `<div style="padding-top:14px">${button(wa, "Message on WhatsApp")}</div>` : ""),
    ),
    section(
      "Order",
      rows([
        ["Order ID", { html: mono(o.orderId) }],
        ["Created", when(o.createdAt)],
        ["Attached", `${plates} printable 3MF${plates === 1 ? "" : "s"} for Bambu Studio, spec (.txt), logo file if uploaded`],
      ]),
    ),
  ].join("");

  const tag = `${c.staff.length} badge${c.staff.length === 1 ? "" : "s"}`;
  return {
    subject: `[Name Tag] New order ${o.orderId} · ${tag} · ${contact.name || "customer"}`,
    html: shell({
      kind: "Name Tag",
      banner: "NEW ORDER · PRINTABLE 3MF ATTACHED · CHECK NAMES BEFORE PRINTING",
      tone: "info",
      headline: `${esc(tag)} <span style="font-weight:400;color:${C.muted};font-size:16px">${mono(o.orderId)}</span>`,
      sub: `${esc(contact.name || "Customer")} &middot; Design ${esc(c.concept)}`,
      preheader: `${o.orderId} ${tag}`,
      body,
      footer: "Sent by the Zenki Lab store. Order data is shown as submitted by the customer.",
    }),
    text: nameTagSpec(o, plates),
  };
}
