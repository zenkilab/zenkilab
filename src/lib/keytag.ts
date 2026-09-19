// Key tag product rules. Spec: DESIGN_SYSTEM.md section 5.
export type StyleId = "data-plate" | "license-plate";
export type ContentType = "name" | "car-number";
export type ComboId = "heritage" | "precision";

export const MATERIAL = "PETG"; // fixed, never a customer choice
export const BRANDING_DISCOUNT = 50; // Rs., for keeping the zenkilab.com stamp
export const QUOTE_HOURS = 24;

export const STYLES: Record<
  StyleId,
  { label: string; content: ContentType; maxChars: number; basePrice: number; blurb: string }
> = {
  "data-plate": {
    label: "Data Plate",
    content: "name",
    maxChars: 16,
    // ponytail: placeholder prices, no source in the repo. Confirm before launch.
    basePrice: 900,
    blurb: "Riveted plate for a name.",
  },
  "license-plate": {
    label: "License Plate",
    content: "car-number",
    maxChars: 10,
    basePrice: 800,
    blurb: "Plate proportions with a thin accent border.",
  },
};

export const COMBOS: Record<ComboId, { label: string; body: string; accent: string; accentName: string }> = {
  heritage: { label: "Heritage", body: "#15181D", accent: "#C49B3C", accentName: "amber" },
  precision: { label: "Precision", body: "#15181D", accent: "#22D3EE", accentName: "cyan" },
};

export type KeyTagConfig = {
  content: ContentType;
  style: StyleId;
  combo: ComboId;
  text: string;
  branding: boolean;
};

export const styleForContent = (c: ContentType): StyleId => (c === "name" ? "data-plate" : "license-plate");

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
  return { base, discount, total: base - discount };
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
    `zenkilab.com stamp: ${c.branding ? "ON (Rs. 50 discount applied)" : "OFF"}`,
    "",
    `Base price: ${rs(p.base)}`,
    `Branding discount: ${p.discount ? "-" + rs(p.discount) : "none"}`,
    `Total: ${rs(p.total)}`,
    "Payment: not collected. On delivery or confirmed over WhatsApp.",
    "",
    `AMS: the 3MF has two objects. Body = black, Accent = ${combo.accentName}. Assign slots in Bambu Studio and check text before printing.`,
    `Quote expires: ${new Date(o.expiresAt).toISOString()}`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}
