// Key tag product rules. Spec: DESIGN_SYSTEM.md section 5.
export type StyleId = "capsule";
export type ContentType = "name" | "car-number";
export type ComboId = "heritage" | "precision";

export const MATERIAL = "PETG"; // fixed, never a customer choice
export const BRANDING_DISCOUNT = 50; // Rs., for keeping the zenkilab.com stamp
export const RFID_PRICE = 200; // Rs., optional RFID chip inside the tag
export const QUOTE_HOURS = 24;

/** Physical tag, millimetres. Rim, lettering and rings stand EMBOSS above a recessed floor on both faces. */
export const TAG = {
  W: 64,
  H: 25,
  FLOOR: 1.6, // thickness of the recessed floor
  EMBOSS: 1.0, // how far rim and lettering stand above (and the floor sits below) each face
  RIM: 1.4, // width of the raised border
  HOLE_R: 2.25, // keyring hole radius
  HOLE_X: -24.5,
  /** Wet RFID inlay, 20 x 10 mm with clearance, sealed inside the floor */
  POCKET: { w: 20.6, h: 10.6, t: 0.5, cx: 4.6 },
} as const;

// Total thickness = FLOOR + 2 x EMBOSS = 3.6 mm
// Print Z (back face down) at which the pocket roof starts, where the operator pauses
export const RFID_PAUSE_Z = TAG.EMBOSS + TAG.FLOOR / 2 + TAG.POCKET.t / 2;

export const STYLES: Record<StyleId, { label: string; maxChars: number; basePrice: number }> = {
  capsule: {
    label: "Capsule key tag",
    maxChars: 14,
    // Rs. 300 without the stamp and without RFID. 250 with the stamp. RFID adds 200.
    basePrice: 300,
  },
};

export const COMBOS: Record<ComboId, { label: string; body: string; accent: string; accentName: string }> = {
  heritage: { label: "Heritage", body: "#15181D", accent: "#F5A623", accentName: "amber" },
  precision: { label: "Precision", body: "#15181D", accent: "#38C8F5", accentName: "cyan" },
};

export type KeyTagConfig = {
  content: ContentType;
  style: StyleId;
  combo: ComboId;
  text: string;
  branding: boolean;
  rfid: boolean;
};

export const styleForContent = (_c: ContentType): StyleId => "capsule";

export function sanitizeText(content: ContentType, style: StyleId, raw: string) {
  const cleaned =
    content === "car-number"
      ? raw.toUpperCase().replace(/[^A-Z0-9 \-]/g, "")
      : raw.replace(/[^A-Za-z0-9 .\-]/g, "");
  return cleaned.slice(0, STYLES[style].maxChars);
}

export function priceLines(c: KeyTagConfig) {
  const base = STYLES[c.style].basePrice;
  const discount = c.branding ? BRANDING_DISCOUNT : 0;
  const rfid = c.rfid ? RFID_PRICE : 0;
  return { base, discount, rfid, total: base - discount + rfid };
}

export const rs = (n: number) => `Rs. ${n.toLocaleString("en-LK")}`;

export type StoredOrder = {
  orderId: string;
  config: KeyTagConfig;
  contact: { name: string; phone: string };
  thumbnail: string;
  createdAt: number;
  expiresAt: number;
  confirmed?: boolean;
};

export const STORAGE_KEY = "zenki.keytag";

export function orderSpec(
  o: Pick<StoredOrder, "orderId" | "config" | "contact" | "expiresAt">,
  stage: "quote" | "confirm",
) {
  const { config: c, contact } = o;
  const p = priceLines(c);
  const combo = COMBOS[c.combo];
  return [
    stage === "confirm" ? "KEY TAG ORDER CONFIRMED, ADD TO PRINT QUEUE" : "KEY TAG QUOTE REQUEST",
    `Order ID: ${o.orderId}`,
    `Customer: ${contact.name}`,
    `WhatsApp/phone: ${contact.phone}`,
    "",
    `Style: ${STYLES[c.style].label}`,
    `Content type: ${c.content === "name" ? "Name" : "Car Number"}`,
    `Text: "${c.text}"`,
    `Color combo: ${combo.label} (black body + ${combo.accentName} accent)`,
    `Material: ${MATERIAL}`,
    `Back: ${c.branding ? "zenkilab.com stamp only" : "blank"}`,
    `RFID chip: ${c.rfid ? "YES, embed before sealing (+Rs. 200)" : "no"}`,
    `zenkilab.com stamp: ${c.branding ? "ON (Rs. 50 discount applied)" : "OFF"}`,
    "",
    `Base price: ${rs(p.base)}`,
    `Branding discount: ${p.discount ? "-" + rs(p.discount) : "none"}`,
    `RFID chip: ${p.rfid ? "+" + rs(p.rfid) : "none"}`,
    `Total: ${rs(p.total)}`,
    "Payment: not collected. On delivery or confirmed over WhatsApp.",
    "",
    `AMS: the 3MF has two objects. Floor = black, Rim and lettering = ${combo.accentName}. Assign slots in Bambu Studio and check text before printing.`,
    c.rfid ? `RFID: 20 x 10 mm wet inlay. Pause at Z = ${RFID_PAUSE_Z.toFixed(2)} mm (before the roof over the pocket), place the inlay in the pocket, resume. Pocket ${TAG.POCKET.w} x ${TAG.POCKET.h} x ${TAG.POCKET.t} mm.` : null,
    `Quote expires: ${new Date(o.expiresAt).toISOString()}`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}
