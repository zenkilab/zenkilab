import { whatsappLink } from "@/lib/store";

// AyuVeda staff badge. Direct-link only (not in storeItems). Sizes are millimetres.
// Concept data mirrors the review sheet: A is the recommendation.
export type ConceptId = "A" | "B";
export type MaterialId = "pla" | "petg";

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
    body: string; name: string; role: string; accent: string;
    pins: number[]; // pin pocket centres from the left edge
    filaments: string;
  }
> = {
  A: {
    label: "Ivory and terracotta",
    blurb: "Warm and soft, closest to the AyuVeda website. Three filaments.",
    w: 78, h: 26, logo: 20, textW: 48, nameSize: 6, roleSize: 3.6, gap: 4,
    body: "linear-gradient(160deg,#F7F0E4,#EDE3D2)", name: "#2A231E", role: "#4A3F37", accent: "#D78258",
    pins: [17, 61], filaments: "Ivory body, terracotta logo and rule, charcoal lettering",
  },
  B: {
    label: "Charcoal and terracotta",
    blurb: "More contrast, reads from further away. Best for shorter names. Two filaments.",
    w: 66, h: 30, logo: 24, textW: 32, nameSize: 5.2, roleSize: 3.3, gap: 3.5,
    body: "linear-gradient(160deg,#2B2520,#1F1B18)", name: "#F5EFE6", role: "#D78258", accent: "#D78258",
    pins: [16, 50], filaments: "Charcoal body, terracotta logo, rule and role, ivory name",
  },
};

export const MATERIALS: Record<MaterialId, { label: string; note: string }> = {
  pla: { label: "Matte PLA+", note: "Clean and light. Best for indoor wear." },
  petg: { label: "PETG", note: "Tougher and heat resistant. Better outdoors or in a hot car." },
};

export const THICKNESS = 2.4; // 1.6 floor + 0.8 raised lettering
export const MAX_NAME = 24;
export const MAX_ROLE = 48;

export type Staff = { name: string; role: string };

// ponytail: names and roles are placeholders until the real staff list arrives
export const SAMPLE_STAFF: Staff[] = [
  { name: "Nimali Perera", role: "Ayurveda Therapist" },
  { name: "Chathurika Wijesundara", role: "Senior Physiotherapist and Rehabilitation Lead" },
];

export const DEFAULT_LOGO = "/store/ayuveda-logo.png";

// Sans faces with Medium and SemiBold weights, so raised strokes stay at 0.8 mm or more.
export const FONTS = [
  { id: "Inter", note: "Matches ayuvedasrilanka.com" },
  { id: "DM Sans", note: "Soft and friendly" },
  { id: "Nunito Sans", note: "Rounded, calm" },
  { id: "Lato", note: "Classic, very legible" },
  { id: "Montserrat", note: "Wide, the key tag font" },
] as const;
export type FontId = (typeof FONTS)[number]["id"];

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

export const approvalMessage = (concept: ConceptId, material: MaterialId, staff: Staff[]) =>
  whatsappLink(
    [
      `Hi Zenki Lab, AyuVeda staff badges: I approve Concept ${concept} (${CONCEPTS[concept].label}), ${CONCEPTS[concept].w} x ${CONCEPTS[concept].h} mm, ${MATERIALS[material].label}.`,
      `Staff (${staff.length}):`,
      ...staff.map((s, i) => `${i + 1}. ${s.name || "(name)"} - ${s.role || "(role)"}`),
    ].join("\n"),
  );
