// Key tag product rules. Spec: DESIGN_SYSTEM.md section 5.
export type StyleId = "capsule" | "ring";
export type ContentType = "name" | "car-number";
export type ComboId = "heritage" | "precision";
// How round the ring tag's plate corners are. A named choice, not a number, so it reads
// clearly to a customer who has never heard the word "radius".
export type Corner = "sharp" | "soft" | "round";

export const MATERIAL = "PETG"; // fixed, never a customer choice
export const BRANDING_DISCOUNT = 50; // Rs., for keeping the zenkilab.com stamp
export const NFC_PRICE = 200; // Rs., optional NFC chip inside the tag
export const QUOTE_HOURS = 24;

/**
 * Physical tag, millimetres. FRONT: rim, ring and lettering stand EMBOSS above a recessed floor.
 * BACK: completely flat. The marketing line, when kept, is a flush color inlay INLAY deep.
 */
export const TAG = {
  W: 50, // 5 cm
  H: 25, // 2.5 cm
  FLOOR: 1.6, // thickness of the floor
  EMBOSS: 1.0, // how far rim, ring and lettering stand above the floor, front only
  INLAY: 0.4, // depth of the flush marketing lettering on the back
  RIM: 2.3, // width of the raised border
  HOLE_R: 2.25, // keyring hole radius
  /** NFC film, 20 x 10 x 0.1 mm, sealed inside the floor. t and zc are set so the pocket's floor and
   * roof each land on a print layer line (0.6-0.8 mm at the coded 0.2 mm layer height): zc = height of
   * its centre from the back face. */
  POCKET: { w: 20.6, h: 10.6, t: 0.2, zc: 0.7 },
} as const;

// Total thickness = FLOOR + EMBOSS = 2.6 mm. The flat back prints face down on the bed.
// Print Z at which the pocket roof starts, where the operator pauses
export const NFC_PAUSE_Z = TAG.POCKET.zc + TAG.POCKET.t / 2;
// Slicer layer height, and the layer (its top Z) where the pause sits: the first layer whose midpoint is above the pocket, so the pocket is fully open below it
export const PRINT_LAYER = 0.2;
export const NFC_PAUSE_LAYER_Z = (Math.floor(NFC_PAUSE_Z / PRINT_LAYER + 0.5) + 1) * PRINT_LAYER;

export const STYLES: Record<StyleId, { label: string; maxChars: number; basePrice: number }> = {
  capsule: {
    label: "Capsule key tag",
    maxChars: 10, // the hole sits in the text row, so 5 cm leaves room for about 10 letters
    // Rs. 300 without the stamp and without NFC. 250 with the stamp. NFC adds 200.
    basePrice: 300,
  },
  ring: { label: "Ring key tag", maxChars: 12, basePrice: 300 },
};

// Plate corner radius, mm, for the ring tag's three roundness presets. The right edge (top right
// and bottom right corners, both this radius) is the tightest fit: it must stay under ~11.375 mm
// or the two arcs overlap, so "round" keeps a safety margin under that.
export const CORNER_RADIUS: Record<Corner, number> = { sharp: 5, soft: 7.5, round: 10 };
export const CORNER_LABEL: Record<Corner, string> = { sharp: "Sharp", soft: "Soft", round: "Round" };

export const COMBOS: Record<ComboId, { label: string; body: string; accent: string; accentName: string }> = {
  heritage: { label: "Heritage", body: "#15181D", accent: "#F5A623", accentName: "amber" },
  precision: { label: "Precision", body: "#15181D", accent: "#38C8F5", accentName: "cyan" },
};

export type KeyTagConfig = {
  content: ContentType;
  style: StyleId;
  corner: Corner; // ignored on the capsule, which has no plate corners to round
  combo: ComboId;
  text: string;
  branding: boolean;
  nfc: boolean;
};

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
  const nfc = c.nfc ? NFC_PRICE : 0;
  return { base, discount, nfc, total: base - discount + nfc };
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
    `Style: ${STYLES[c.style].label}${c.style === "ring" ? ` (${CORNER_LABEL[c.corner]} corners)` : ""}`,
    `Content type: ${c.content === "name" ? "Name" : "Car Number"}`,
    `Text: "${c.text}"`,
    `Color combo: ${combo.label} (black body + ${combo.accentName} accent)`,
    `Material: ${MATERIAL}`,
    `Back: flat. ${c.branding ? "ZenkiLab.com as a flush 0.4 mm color inlay, no relief" : "blank"}`,
    `NFC chip: ${c.nfc ? "YES, embed before sealing (+Rs. 200)" : "no"}`,
    `zenkilab.com stamp: ${c.branding ? "ON (Rs. 50 discount applied)" : "OFF"}`,
    "",
    `Base price: ${rs(p.base)}`,
    `Branding discount: ${p.discount ? "-" + rs(p.discount) : "none"}`,
    `NFC chip: ${p.nfc ? "+" + rs(p.nfc) : "none"}`,
    `Total: ${rs(p.total)}`,
    "Payment: not collected. On delivery or confirmed over WhatsApp.",
    "",
    `Colors: the 3MF is one object with two parts already on filament slots 1 (black floor) and 2 (${combo.accentName} rim, ring and lettering). Check the text before printing.`,
    c.nfc ? `NFC: 20 x 10 mm film (liner peeled). A pause (M400 U1) is already in the 3MF at Z = ${NFC_PAUSE_LAYER_Z.toFixed(2)} mm, after the pocket is printed and before its roof. Place the film in the pocket, then resume. Pocket ${TAG.POCKET.w} x ${TAG.POCKET.h} x ${TAG.POCKET.t} mm.` : null,
    `Quote expires: ${new Date(o.expiresAt).toISOString()}`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}
