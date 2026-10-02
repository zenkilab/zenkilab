// Dog tag product rules. See the plan at ~/.claude/plans (Dog Tag: NFC + QR pet-recovery tag).
export const MATERIAL = "ASA"; // fixed, never a customer choice: outdoor UV/weather resistance over PETG
export const PRICE = 1290; // Rs., flat: NFC + QR + visible number are the whole point, not an add-on
export const INTRO_PRICE = 990; // Rs., introductory/promotional price while the product is new
export const QUOTE_HOURS = 24;
export const MAX_NAME = 14;

/**
 * Physical tag, millimetres. A flat plate with two closed belt loops (tunnels) on its BACK, one at each
 * end. The collar threads through both and runs along the plate's length, so between the loops the back
 * is open and the collar itself shows. Each tunnel opens to collar width x collar thickness (plus a little
 * clearance), has thick POST walls at the plate's top/bottom edges and a STRAP behind the collar, and all
 * inside corners are rounded so a thick ASA/PETG print doesn't crack from a sharp 90 degree stress point.
 * The plate takes a gentle cylindrical bend (see BEND_RADIUS) so it follows the collar's curve.
 *
 * Everything readable lives on the FRONT (flush accent inlays, same technique as the Key Tag's marketing
 * stamp): the back sits against the collar once worn. The plate's HEIGHT scales with collar width and the
 * loops' depth with collar thickness; the plate's length is fixed. The NFC pocket sits in the plate itself,
 * well clear of the loops.
 */
export const TAG = {
  W: 72, // fixed plate length
  MIN_H: 26, // minimum plate height, even for the narrowest collar: enough for the QR block plus margin
  FLOOR: 5, // plate thickness (front inlay, NFC pocket and back inlay with real wall between them)
  INLAY: 0.4, // depth of each flush inlay, both faces
  CORNER_R: 4, // outer plate corner radius
  LOOP_L: 14, // length of each loop along the collar: long enough to hold it square, short enough to leave the middle exposed
  POST: 4, // minimum wall at the plate's top and bottom edges beside the collar opening
  STRAP: 4, // thickness of the strap behind the collar
  CLEAR_W: 2, // total width clearance added to the collar width (1 mm a side)
  CLEAR_T: 1, // thickness clearance added to the collar thickness
  R_IN: 2, // radius on every inside corner of the opening (stress relief)
  R_OUT: 3, // radius on the strap's outer corners
  QR_SIZE: 18, // the embossed QR block, square. 21x21 modules at ~0.85mm/module: comfortably scannable
  BEND_RADIUS: 180, // virtual cylinder radius for the gentle curve along the plate's length
  /** Same physical component as the Key Tag's NFC film: 20 x 10 x 0.1 mm. Sits in the back wall band,
   * clear of the back inlay, so it needs no Y or X clearance logic at all. */
  POCKET: { w: 20.6, h: 10.6, t: 0.2, zc: 1.1 },
} as const;

export const PRINT_LAYER = 0.2;
// Printed FRONT FACE DOWN (so QR/text sit on the bed and the loops grow upward from the back, needing
// supports only inside the tunnels). Print Z = FLOOR - model Z. The pocket is one layer thick at the
// plate's centre line (print Z 3.8..4.0); the pause lands on the first layer entirely above it. The bend
// tilts the pocket's far edges up to ~0.3 mm higher, which the 0.1 mm film simply gets printed over.
export const NFC_PAUSE_Z = TAG.FLOOR - (TAG.POCKET.zc - TAG.POCKET.t / 2);
export const NFC_PAUSE_LAYER_Z = Math.round((Math.floor(NFC_PAUSE_Z / PRINT_LAYER + 0.5) + 1) * PRINT_LAYER * 100) / 100;

export const COMBOS = {
  heritage: { label: "Heritage", body: "#15181D", accent: "#F5A623", accentName: "amber" },
  precision: { label: "Precision", body: "#15181D", accent: "#38C8F5", accentName: "cyan" },
} as const;
export type ComboId = keyof typeof COMBOS;

export type DogTagConfig = {
  collarWidthMm: number;
  collarThicknessMm: number;
  phone: string;
  petName: string;
  combo: ComboId;
  /** Printing the name + phone on the front (alongside the QR) is a customer choice: on by default
   * since it's the low-tech fallback for anyone who won't tap or scan, off for owners who'd rather the
   * number wasn't readable at a glance. */
  showText: boolean;
};

export function plateHeight(collarWidthMm: number) {
  return Math.max(TAG.MIN_H, collarWidthMm + TAG.CLEAR_W + 2 * TAG.POST);
}

export function sanitizeCollarWidth(raw: number) {
  if (!Number.isFinite(raw)) return 20;
  return Math.min(60, Math.max(10, Math.round(raw)));
}

export function sanitizeCollarThickness(raw: number) {
  if (!Number.isFinite(raw)) return 4;
  return Math.min(12, Math.max(2, Math.round(raw * 2) / 2));
}

/** Digits and a leading +, nothing else: this is what actually gets written to the NFC chip and QR. */
export function sanitizePhone(raw: string) {
  const plus = raw.trim().startsWith("+") ? "+" : "";
  return plus + raw.replace(/[^\d]/g, "");
}

export function sanitizePetName(raw: string) {
  return raw.replace(/[^A-Za-z0-9 .\-]/g, "").slice(0, MAX_NAME);
}

export const rs = (n: number) => `Rs. ${n.toLocaleString("en-LK")}`;

export type StoredDogTagOrder = {
  orderId: string;
  config: DogTagConfig;
  contact: { name: string; phone: string };
  thumbnail: string;
  createdAt: number;
  expiresAt: number;
  confirmed?: boolean;
};

export const STORAGE_KEY = "zenki.dogtag";

export function orderSpec(
  o: Pick<StoredDogTagOrder, "orderId" | "config" | "contact" | "expiresAt">,
  stage: "quote" | "confirm",
) {
  const { config: c, contact } = o;
  const combo = COMBOS[c.combo];
  const phone = sanitizePhone(c.phone);
  return [
    stage === "confirm" ? "DOG TAG ORDER CONFIRMED, ADD TO PRINT QUEUE" : "DOG TAG QUOTE REQUEST",
    `Order ID: ${o.orderId}`,
    `Customer: ${contact.name}`,
    `WhatsApp/phone: ${contact.phone}`,
    "",
    `Collar width: ${c.collarWidthMm} mm, thickness: ${c.collarThicknessMm} mm`,
    `Belt loops: 2 closed tunnels on the back, opening ${c.collarWidthMm + TAG.CLEAR_W} x ${c.collarThicknessMm + TAG.CLEAR_T} mm, ${TAG.LOOP_L} mm long. Print FRONT FACE DOWN with supports inside the tunnels.`,
    `Plate: ${TAG.W} x ${plateHeight(c.collarWidthMm).toFixed(1)} mm`,
    `Pet name on tag: ${c.showText && c.petName ? `"${c.petName}"` : "(none)"}`,
    `Phone in QR + NFC: ${phone}`,
    `Phone also printed visibly on the front: ${c.showText ? "YES" : "no, QR/NFC only"}`,
    `Color combo: ${combo.label} (black body + ${combo.accentName} accent)`,
    `Material: ${MATERIAL} (outdoor UV/weather resistance)`,
    "",
    `Price: ${rs(PRICE)}, introductory price ${rs(INTRO_PRICE)}`,
    "Payment: not collected. On delivery or confirmed over WhatsApp.",
    "",
    `IMPORTANT, do this BEFORE embedding: program the NFC chip with the NDEF record "tel:${phone}" ` +
      `(e.g. NFC Tools app, "Write" > "Add a record" > "Phone number") so any phone can tap it and call ` +
      `this number directly. This is a blank chip today; it must be written before it goes in the pocket.`,
    `NFC pocket: ${TAG.POCKET.w} x ${TAG.POCKET.h} x ${TAG.POCKET.t} mm. A pause (M400 U1) is already in ` +
      `the 3MF at Z = ${NFC_PAUSE_LAYER_Z.toFixed(2)} mm, after the pocket is printed and before its roof. ` +
      `Place the programmed chip in the pocket, then resume.`,
    "QR code and phone number are already part of the printed geometry, nothing else to add there.",
    `Quote expires: ${new Date(o.expiresAt).toISOString()}`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}
