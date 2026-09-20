import {
  COMBOS,
  MATERIAL,
  RFID_PAUSE_LAYER_Z,
  STYLES,
  TAG,
  orderSpec,
  priceLines,
  rs,
  sanitizeText,
  type ComboId,
  type ContentType,
  type StoredOrder,
} from "../../src/lib/keytag";
import { C, button, callout, esc, mono, rows, section, shell, whatsappUrl } from "./email";

export type Stage = "quote" | "confirm";
export type Order = Pick<StoredOrder, "orderId" | "config" | "contact" | "createdAt" | "expiresAt">;

const when = (t: number) =>
  new Date(t).toLocaleString("en-GB", { timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short" });

/**
 * The order comes from a public form, so nothing in it is trusted: enums are checked, the tag
 * text is cleaned by the same rule the customizer uses, and prices are recomputed here.
 */
export function parseOrder(raw: string): Order | null {
  try {
    const o = JSON.parse(raw);
    const c = o?.config;
    const content: ContentType | null = c?.content === "name" || c?.content === "car-number" ? c.content : null;
    const combo: ComboId | null = Object.hasOwn(COMBOS, c?.combo) ? c.combo : null;
    if (!content || !combo || !/^KT-[A-Z0-9]{4,16}$/.test(o.orderId)) return null;
    const text = sanitizeText(content, "capsule", String(c.text ?? "")).trim();
    const createdAt = Number(o.createdAt);
    const expiresAt = Number(o.expiresAt);
    if (!text || !Number.isFinite(createdAt) || !Number.isFinite(expiresAt)) return null;
    return {
      orderId: o.orderId,
      config: { content, style: "capsule", combo, text, branding: c.branding === true, rfid: c.rfid === true },
      contact: { name: String(o.contact?.name ?? "").trim().slice(0, 80), phone: String(o.contact?.phone ?? "").trim().slice(0, 30) },
      createdAt,
      expiresAt,
    };
  } catch {
    return null;
  }
}

const swatch = (hex: string) =>
  `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${hex};border:1px solid #C9CED6;vertical-align:-1px;margin-right:6px"></span>`;

export function keyTagEmail(o: Order, stage: Stage, hasPreview: boolean) {
  const { config: c, contact } = o;
  const combo = COMBOS[c.combo];
  const p = priceLines(c);
  const confirmed = stage === "confirm";
  const wa = whatsappUrl(contact.phone);
  const flags = [c.rfid ? "RFID" : "", c.branding ? "" : "no stamp"].filter(Boolean).join(" · ");

  const price = rows([
    ["Base price", rs(p.base)],
    ...(p.discount ? ([["zenkilab.com stamp discount", { html: `<span style="color:${C.ok}">-${esc(rs(p.discount))}</span>` }]] as [string, { html: string }][]) : []),
    ...(p.rfid ? ([["RFID chip", `+${rs(p.rfid)}`]] as [string, string][]) : []),
    ["Total", { html: `<strong style="font-size:18px">${esc(rs(p.total))}</strong>` }],
  ]);

  const steps = confirmed
    ? [
        `Open the 3MF attached to the quote email for ${o.orderId} in Bambu Studio.`,
        `Check the text reads "${c.text}" and slot 2 is ${combo.accentName}.`,
        ...(c.rfid ? [`The printer pauses at Z ${RFID_PAUSE_LAYER_Z.toFixed(2)} mm. Place the 20 x 10 mm wet inlay in the pocket, then resume.`] : []),
        "Message the customer on WhatsApp once it is in the print queue. Payment is on delivery or over WhatsApp.",
      ]
    : [
        "The customer has not confirmed. Do not print yet.",
        "Print only after a CONFIRMED email arrives with this order ID.",
        `The 3MF is attached to this email${c.rfid ? ", with the RFID pause already set" : ""}.`,
      ];
  const stepList = `<ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.6;color:${C.ink}">${steps.map((s) => `<li style="margin-bottom:4px">${esc(s)}</li>`).join("")}</ol>`;

  const body = [
    hasPreview
      ? `<tr><td style="padding:20px 28px 0"><img src="cid:tag-preview" alt="Customer's key tag design" width="544" style="display:block;width:100%;max-width:544px;height:auto;border-radius:10px;border:1px solid ${C.line}"></td></tr>`
      : "",
    c.rfid
      ? callout("warn", "RFID INLAY REQUIRED", `Pocket ${TAG.POCKET.w} x ${TAG.POCKET.h} x ${TAG.POCKET.t} mm. The print pauses at Z ${RFID_PAUSE_LAYER_Z.toFixed(2)} mm for the operator to place the inlay.`)
      : "",
    section(
      "What to print",
      rows([
        ["Text", { html: `<strong style="font-size:16px;letter-spacing:.02em">${esc(c.text)}</strong>` }],
        ["Type", c.content === "name" ? "Name" : "Car number"],
        ["Style", STYLES[c.style].label],
        ["Colours", { html: `${swatch(combo.body)}Floor black &nbsp; ${swatch(combo.accent)}${esc(combo.label)} ${esc(combo.accentName)} (rim, ring, lettering)` }],
        ["Material", MATERIAL],
        ["Back", c.branding ? `Flat, zenkilab.com as a flush ${TAG.INLAY} mm inlay` : "Flat, blank"],
        ["RFID", c.rfid ? { html: `<strong style="color:${C.amberInk}">YES</strong> (+${esc(rs(p.rfid))})` } : "No"],
      ]),
    ),
    section(
      "Customer",
      rows([
        ["Name", contact.name || "-"],
        ["WhatsApp / phone", contact.phone || "-"],
      ]) + (wa ? `<div style="padding-top:14px">${button(wa, "Message on WhatsApp")}</div>` : ""),
    ),
    section("Price", price),
    section(confirmed ? "Next steps" : "Status", stepList),
    section(
      "Order",
      rows([
        ["Order ID", { html: mono(o.orderId) }],
        ["Created", when(o.createdAt)],
        ["Quote valid until", when(o.expiresAt)],
        ["Attached", confirmed ? "Spec (.txt)" : "3MF for Bambu Studio, spec (.txt)"],
      ]),
    ),
  ].join("");

  const tag = `"${c.text}"`;
  return {
    subject: confirmed
      ? `[Key Tag] CONFIRMED ${o.orderId} ${tag}${flags ? " · " + flags : ""}: print it`
      : `[Key Tag] New quote ${o.orderId} ${tag}${flags ? " · " + flags : ""}`,
    html: shell({
      kind: "Key Tag",
      banner: confirmed ? "CONFIRMED · CUSTOMER SAYS GO · ADD TO PRINT QUEUE" : "NEW QUOTE · WAITING FOR CUSTOMER TO CONFIRM",
      tone: confirmed ? "ok" : "info",
      headline: `${esc(c.text)} <span style="font-weight:400;color:${C.muted};font-size:16px">${mono(o.orderId)}</span>`,
      sub: `${esc(contact.name || "Customer")} &middot; ${esc(rs(p.total))}${c.rfid ? " &middot; RFID" : ""}`,
      preheader: `${o.orderId} ${tag} ${rs(p.total)}${c.rfid ? ", RFID" : ""}`,
      body,
      footer: `Sent by the Zenki Lab store. Order data is shown as submitted by the customer; prices are recalculated by the server.`,
    }),
    text: orderSpec(o, stage),
  };
}
