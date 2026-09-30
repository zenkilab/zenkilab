// Dog tag product rules. See the plan at ~/.claude/plans (Dog Tag: NFC + QR pet-recovery tag).
export const MATERIAL = "ASA"; // fixed, never a customer choice: outdoor UV/weather resistance over PETG
export const PRICE = 1290; // Rs., flat: NFC + QR + visible number are the whole point, not an add-on
export const INTRO_PRICE = 990; // Rs., introductory/promotional price while the product is new
export const QUOTE_HOURS = 24;
export const MAX_NAME = 14;

/**
 * Physical tag, millimetres. Not two separate holes: one continuous channel runs the full length of
 * the plate, buried in the middle of its thickness, open only at the two tips. The collar goes in one
 * tip, travels hidden inside the plate, and comes out the other, captured along its whole length
 * instead of pivoting around one point. The whole plate then takes a gentle cylindrical bend (see
 * BEND_RADIUS) so the collar doesn't have to locally flatten out to follow it.
 *
 * Because the channel is buried mid-thickness, not cut through the faces, the front and back surfaces
 * stay solid across the whole plate and don't need to route around it: the FRONT face (z FLOOR-INLAY..
 * FLOOR) carries the QR code, the pet name and the phone number, all flush accent inlays, same
 * technique as the Key Tag's marketing stamp. Everything readable lives on the front on purpose: the
 * back sits against the collar once worn, so anything printed there would never be seen. The channel's
 * opening height has to fit the collar's width, so the plate's HEIGHT scales with collar width; its
 * length is fixed.
 *
 * The NFC pocket sits in its own Z band, between the back inlay and the channel, so it doesn't need to
 * dodge the channel in X or Y at all, only in Z.
 */
export const TAG = {
  W: 72, // fixed plate length
  MIN_H: 26, // minimum plate height, even for the narrowest collar: enough for the QR block plus margin
  CHANNEL_Y_CLEARANCE: 3, // added to the collar width to get the channel's opening height
  Y_MARGIN: 8, // total solid plate required above and below the channel
  CHANNEL_T: 3.5, // channel opening depth (fits collar material thickness + clearance)
  CHANNEL_ZC: 4.5, // channel centre, in Z, from the back face
  CORNER_R: 4, // outer plate corner radius
  FLOOR: 8, // total plate thickness: generous, so the inlays, the NFC pocket and the channel all
  // land in clearly separated Z bands with real wall thickness between them
  INLAY: 0.4, // depth of each flush inlay, both faces
  QR_SIZE: 18, // the embossed QR block, square. 21x21 modules at ~0.85mm/module: comfortably scannable
  BEND_RADIUS: 180, // virtual cylinder radius for the gentle curve along the plate's length
  /** Same physical component as the Key Tag's NFC film: 20 x 10 x 0.1 mm. Sits in the back wall band,
   * clear of both the back inlay and the channel, so it needs no Y or X clearance logic at all. */
  POCKET: { w: 20.6, h: 10.6, t: 0.2, zc: 1.0 },
} as const;

export const PRINT_LAYER = 0.2;
// Pocket top (1.6mm) is already a layer line, so the pause lands exactly on the next one, no waste.
export const NFC_PAUSE_Z = TAG.POCKET.zc + TAG.POCKET.t / 2;
export const NFC_PAUSE_LAYER_Z = (Math.floor(NFC_PAUSE_Z / PRINT_LAYER + 0.5) + 1) * PRINT_LAYER;

export const COMBOS = {
  heritage: { label: "Heritage", body: "#15181D", accent: "#F5A623", accentName: "amber" },
  precision: { label: "Precision", body: "#15181D", accent: "#38C8F5", accentName: "cyan" },
} as const;
export type ComboId = keyof typeof COMBOS;

export type DogTagConfig = {
  collarWidthMm: number;
  phone: string;
  petName: string;
  combo: ComboId;
  /** Printing the name + phone on the front (alongside the QR) is a customer choice: on by default
   * since it's the low-tech fallback for anyone who won't tap or scan, off for owners who'd rather the
   * number wasn't readable at a glance. */
  showText: boolean;
};

export function plateHeight(collarWidthMm: number) {
  return Math.max(TAG.MIN_H, collarWidthMm + TAG.CHANNEL_Y_CLEARANCE + TAG.Y_MARGIN);
}

export function sanitizeCollarWidth(raw: number) {
  if (!Number.isFinite(raw)) return 20;
  return Math.min(60, Math.max(10, Math.round(raw)));
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
    `Collar width: ${c.collarWidthMm} mm`,
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
