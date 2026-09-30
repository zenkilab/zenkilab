import {
  COMBOS,
  INTRO_PRICE,
  MATERIAL,
  NFC_PAUSE_LAYER_Z,
  PRICE,
  TAG,
  orderSpec,
  plateHeight,
  rs,
  sanitizeCollarWidth,
  sanitizePetName,
  sanitizePhone,
  type ComboId,
  type StoredDogTagOrder,
} from "../../src/lib/dogtag";
import { C, button, callout, esc, mono, rows, section, shell, whatsappUrl } from "./email";

export type Stage = "quote" | "confirm";
export type Order = Pick<StoredDogTagOrder, "orderId" | "config" | "contact" | "createdAt" | "expiresAt">;

const when = (t: number) =>
  new Date(t).toLocaleString("en-GB", { timeZone: "Asia/Colombo", dateStyle: "medium", timeStyle: "short" });

/**
 * The order comes from a public form, so nothing in it is trusted: the combo is checked, collar
 * width and phone/name are cleaned by the same rules the customizer uses.
 */
export function parseOrder(raw: string): Order | null {
  try {
    const o = JSON.parse(raw);
    const c = o?.config;
    const combo: ComboId | null = Object.hasOwn(COMBOS, c?.combo) ? c.combo : null;
    const phone = sanitizePhone(String(c?.phone ?? ""));
    if (!combo || phone.replace(/\D/g, "").length < 9 || !/^DT-[A-Z0-9]{4,16}$/.test(o.orderId)) return null;
    const createdAt = Number(o.createdAt);
    const expiresAt = Number(o.expiresAt);
    if (!Number.isFinite(createdAt) || !Number.isFinite(expiresAt)) return null;
    return {
      orderId: o.orderId,
      config: { collarWidthMm: sanitizeCollarWidth(Number(c.collarWidthMm)), phone, petName: sanitizePetName(String(c?.petName ?? "")), combo, showText: c?.showText !== false },
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

export function dogTagEmail(o: Order, stage: Stage, hasPreview: boolean) {
  const { config: c, contact } = o;
  const combo = COMBOS[c.combo];
  const confirmed = stage === "confirm";
  const wa = whatsappUrl(contact.phone);
  const phoneTel = `tel:${c.phone}`;

  const steps = confirmed
    ? [
        `Open the 3MF attached to the quote email for ${o.orderId} in Bambu Studio.`,
        `Program the NFC chip with "${phoneTel}" (NFC Tools app, Write > Add a record > Phone number) BEFORE placing it. This chip is blank until you write to it.`,
        `The printer pauses at Z ${NFC_PAUSE_LAYER_Z.toFixed(2)} mm. Place the programmed chip in the pocket, then resume.`,
        "Message the customer on WhatsApp once it is in the print queue. Payment is on delivery or over WhatsApp.",
      ]
    : [
        "The customer has not confirmed. Do not print yet.",
        "Print only after a CONFIRMED email arrives with this order ID.",
        "The 3MF is attached to this email, with the NFC pause already set.",
      ];
  const stepList = `<ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.6;color:${C.ink}">${steps.map((s) => `<li style="margin-bottom:4px">${esc(s)}</li>`).join("")}</ol>`;

  const body = [
    hasPreview
      ? `<tr><td style="padding:20px 28px 0"><img src="cid:tag-preview" alt="Customer's dog tag design" width="544" style="display:block;width:100%;max-width:544px;height:auto;border-radius:10px;border:1px solid ${C.line}"></td></tr>`
      : "",
    callout("warn", "NFC CHIP MUST BE PROGRAMMED FIRST", `Write "${phoneTel}" to the chip before placing it in the pocket. Pocket ${TAG.POCKET.w} x ${TAG.POCKET.h} x ${TAG.POCKET.t} mm, pause at Z ${NFC_PAUSE_LAYER_Z.toFixed(2)} mm.`),
    section(
      "What to print",
      rows([
        ["Phone (QR + NFC)", { html: mono(c.phone) }],
        ["Also printed on the front", c.showText ? `Yes${c.petName ? ` ("${c.petName}" + number)` : " (number only)"}` : "No, QR/NFC only"],
        ["Collar width", `${c.collarWidthMm} mm`],
        ["Plate size", `${TAG.W} x ${plateHeight(c.collarWidthMm).toFixed(1)} mm`],
        ["Colours", { html: `${swatch(combo.body)}Plate black &nbsp; ${swatch(combo.accent)}${esc(combo.label)} ${esc(combo.accentName)} (QR, label, text)` }],
        ["Material", MATERIAL],
      ]),
    ),
    section(
      "Customer",
      rows([
        ["Name", contact.name || "-"],
        ["WhatsApp / phone", contact.phone || "-"],
      ]) + (wa ? `<div style="padding-top:14px">${button(wa, "Message on WhatsApp")}</div>` : ""),
    ),
    section(
      "Price",
      rows([
        ["List price", { html: `<span style="text-decoration:line-through;color:${C.muted}">${esc(rs(PRICE))}</span>` }],
        ["Total (introductory price)", { html: `<strong style="font-size:18px">${esc(rs(INTRO_PRICE))}</strong>` }],
      ]),
    ),
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

  const label = c.petName ? `"${c.petName}"` : c.phone;
  return {
    subject: confirmed
      ? `[Dog Tag] CONFIRMED ${o.orderId} ${label}: print it`
      : `[Dog Tag] New quote ${o.orderId} ${label}`,
    html: shell({
      kind: "Dog Tag",
      banner: confirmed ? "CONFIRMED · CUSTOMER SAYS GO · ADD TO PRINT QUEUE" : "NEW QUOTE · WAITING FOR CUSTOMER TO CONFIRM",
      tone: confirmed ? "ok" : "info",
      headline: `${esc(label)} <span style="font-weight:400;color:${C.muted};font-size:16px">${mono(o.orderId)}</span>`,
      sub: `${esc(contact.name || "Customer")} &middot; ${esc(rs(INTRO_PRICE))} &middot; NFC + QR`,
      preheader: `${o.orderId} ${label} ${rs(INTRO_PRICE)}`,
      body,
      footer: `Sent by the Zenki Lab store. Order data is shown as submitted by the customer; the price is recalculated by the server.`,
    }),
    text: orderSpec(o, stage),
  };
}
