
// Name tag. Direct-link only (not in storeItems). Sizes are millimetres.
// Concept data mirrors the review sheet: A is the recommendation.
export type ConceptId = "A" | "B";

export const CONCEPTS: Record<
  ConceptId,
  {
    label: string;
    blurb: string;
    w: number; h: number; // badge
    logo: number; // logo diameter
    textW: number; // text column width
    nameSize: number; roleSize: number; // base font sizes
    gap: number; // logo left margin / gap to text
    solid: string; body: string; name: string; role: string; accent: string;
    pins: number[]; // pin pocket centres from the left edge
    filaments: string;
  }
> = {
  A: {
    label: "Ivory and terracotta",
    blurb: "Warm and soft. Three filaments.",
    w: 78, h: 26, logo: 20, textW: 48, nameSize: 6, roleSize: 3.6, gap: 4,
    solid: "#EFE6D6", body: "linear-gradient(160deg,#F7F0E4,#EDE3D2)", name: "#2A231E", role: "#4A3F37", accent: "#D78258",
    pins: [17, 61], filaments: "Ivory body, terracotta logo and rule, charcoal lettering",
  },
  B: {
    label: "Charcoal and terracotta",
    blurb: "More contrast, reads from further away. Best for shorter names. Two filaments.",
    w: 66, h: 30, logo: 24, textW: 32, nameSize: 5.2, roleSize: 3.3, gap: 3.5,
    solid: "#25201C", body: "linear-gradient(160deg,#2B2520,#1F1B18)", name: "#F5EFE6", role: "#D78258", accent: "#D78258",
    pins: [16, 50], filaments: "Charcoal body, terracotta logo, rule and role, ivory name",
  },
};

export const THICKNESS = 2.4; // 1.6 floor + 0.8 raised lettering
export const MAX_NAME = 24;
export const MAX_ROLE = 48;

export type Staff = { name: string; role: string };

// Placeholder until the customer uploads their own: a plain ring and dot.
export const DEFAULT_LOGO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="#000" stroke-width="8"/><circle cx="50" cy="50" r="12" fill="#000"/></svg>');

// The accent (logo, rule and, on the charcoal design, the role line). Terracotta is the default.
export const ACCENTS = [
  { id: "Terracotta", hex: "#D78258" },
  { id: "Amber", hex: "#F5A623" },
  { id: "Sage", hex: "#8FAE8B" },
  { id: "Sky", hex: "#5FB3D9" },
] as const;

// Sans faces with Medium and SemiBold weights, so raised strokes stay at 0.8 mm or more.
export const FONTS = [
  { id: "Inter", note: "Clean and neutral" },
  { id: "DM Sans", note: "Soft and friendly" },
  { id: "Nunito Sans", note: "Rounded, calm" },
  { id: "Lato", note: "Classic, very legible" },
  { id: "Montserrat", note: "Wide, the key tag font" },
] as const;
export type FontId = string; // a built-in font, or one found on the customer website

const LOGO_TYPES = ["image/png", "image/webp", "image/svg+xml"]; // formats that can carry transparency
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/** Reads a logo file into a data URL, or throws a plain-language reason. It must have real transparency. */
export async function readLogo(file: File): Promise<string> {
  if (!LOGO_TYPES.includes(file.type)) throw new Error("Use a PNG, WebP or SVG logo with a transparent background. JPEG files cannot be transparent.");
  if (file.size > MAX_LOGO_BYTES) throw new Error("That file is over 2 MB. Export a smaller version.");
  const url = await new Promise<string>((ok, no) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => no(new Error("Could not read that file."));
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((ok, no) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = () => no(new Error("That file is not a valid image."));
    i.src = url;
  });
  if (file.type !== "image/svg+xml" && Math.min(img.naturalWidth, img.naturalHeight) < 400) throw new Error("This logo is too small and would print blurry. Use an image at least 400 pixels wide, or an SVG.");
  const n = 256;
  const cv = document.createElement("canvas");
  cv.width = cv.height = n;
  const ctx = cv.getContext("2d")!;
  const w = img.naturalWidth || n, h = img.naturalHeight || n, k = Math.min(n / w, n / h);
  ctx.drawImage(img, 0, 0, w * k, h * k);
  const px = ctx.getImageData(0, 0, n, n).data;
  let clear = 0;
  for (let i = 3; i < px.length; i += 4) if (px[i] < 250) clear++;
  if (clear < n * n * 0.05) throw new Error("This logo has a solid background. Upload a version with a transparent background.");
  return url;
}

export const sanitizeLine = (s: string, max: number) => s.replace(/[^\p{L}\p{N} .,'&/()-]/gu, "").slice(0, max);

export const MAX_STAFF = 60;

export type NameTagConfig = { concept: ConceptId; accent: string; font: string; logoName: string; staff: Staff[] };
export type NameTagOrder = { orderId: string; config: NameTagConfig; contact: { name: string; phone: string }; createdAt: number };
