import { contactChannels } from "@/lib/constants";
import { rs } from "@/lib/keytag";
import { place, type StageSlide } from "@/lib/stage";

const wa = contactChannels.find((c) => c.label === "WhatsApp")?.href ?? "https://wa.me/94702100270";

/** Opens WhatsApp with a prefilled message. There is no cart or payment system yet. */
export const whatsappLink = (message: string) => `${wa}?text=${encodeURIComponent(message)}`;

export const DEPOSIT_RATE = 0.5;

export type ChibiSize = {
  id: string;
  label: string;
  approx: string;
  /** LKR. null means the price is confirmed over WhatsApp. */
  price: number | null;
};

export const CHIBI_SIZES: ChibiSize[] = [
  { id: "small", label: "Small", approx: "About 10 cm", price: 4990 },
  // ponytail: Large price not supplied yet. Set it here and the deposit follows.
  { id: "large", label: "Large", approx: "About 20 cm", price: null },
];

export const chibiDeposit = (price: number) => Math.round(price * DEPOSIT_RATE);

export const chibiMessage = (size: ChibiSize) =>
  size.price === null
    ? `Hi Zenki Lab, I would like a Chibi Figure in the ${size.label} size (${size.approx.toLowerCase()}). Could you confirm the price?`
    : `Hi Zenki Lab, I would like a Chibi Figure in the ${size.label} size (${size.approx.toLowerCase()}). Price ${rs(size.price)}, paying the ${rs(chibiDeposit(size.price))} deposit to start.`;

// Subject boxes (pixels) come from the cut-outs. The figure stands about 1.25 circle
// diameters tall with its base near the bottom of the circle, so the head comes out of the top.
const CHIBI_SIZE: [number, number] = [1080, 1350];
const chibiPose = (n: number, bbox: [number, number, number, number], alt: string): StageSlide => ({
  bg: `/store/chibi-${n}.webp`,
  cut: `/store/chibi-${n}-cut.webp`,
  alt,
  box: place({ size: CHIBI_SIZE, bbox, height: 1.25, bottom: 0.93 }),
});

export const chibiStage: StageSlide[] = [
  chibiPose(1, [339, 146, 746, 1231], "Chibi figure of a man with glasses, front view"),
  chibiPose(2, [335, 146, 749, 1230], "The same figure from the side"),
  chibiPose(3, [332, 134, 764, 1252], "The same figure from a three-quarter angle"),
  chibiPose(5, [300, 110, 752, 1295], "The same figure from behind"),
];

/** Photos for the product page slideshow, each cropped on the subject */
export const chibiGallery = [
  { src: "/store/chibi-1.webp", alt: "Chibi figure of a man with glasses, front view" },
  { src: "/store/chibi-2.webp", alt: "The same figure from the side" },
  { src: "/store/chibi-3.webp", alt: "The same figure from a three-quarter angle" },
  { src: "/store/chibi-5.webp", alt: "The same figure from behind" },
  { src: "/store/chibi-4.webp", alt: "Close-up of the face and glasses" },
];

const keyTagStage: StageSlide[] = [
  {
    bg: "/store/key-tag-listing.webp",
    cut: "/store/key-tag-cut.webp",
    alt: "A black capsule key tag with a raised amber rim and lettering",
    // the tag is wider than the circle so its ends come out of the sides
    box: place({ size: CHIBI_SIZE, bbox: [107, 490, 1048, 958], width: 1.2, centre: 0.5 }),
  },
];

export const storeItems = [
  {
    id: "key-tag",
    title: "Custom Key Tag",
    description:
      "A two-tone PETG key tag with your name or car number. See it in 3D as you type, then get a quote.",
    bullets: ["Name or car number", "Heritage or Precision colors", "Optional RFID chip"],
    href: "/store/key-tag",
    cta: "Design Your Tag",
    alt: "A black capsule key tag with a raised amber rim and lettering",
    stage: keyTagStage,
    meta: "Made to order",
  },
  {
    id: "chibi-figure",
    title: "Chibi Figure",
    description:
      "A small stylised figure of a person, generated with Meshy AI and printed at Zenki Lab. You approve the 3D model before anything is printed.",
    bullets: ["About 10 cm or 20 cm", "Approve the model first", "50% deposit to start"],
    href: "/store/chibi-figure",
    cta: "View the Figure",
    alt: "A white 3D printed chibi figure of a man with glasses on a round base",
    stage: chibiStage,
    meta: `From ${rs(CHIBI_SIZES[0].price!)}`,
  },
];
