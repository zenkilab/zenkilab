import { contactChannels } from "@/lib/constants";
import { rs } from "@/lib/keytag";

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

export const storeItems = [
  {
    id: "key-tag",
    title: "Custom Key Tag",
    description:
      "A two-tone PETG key tag with your name or car number. See it in 3D as you type, then get a quote.",
    bullets: ["Data Plate", "License Plate", "Heritage or Precision colors"],
    href: "/store/key-tag",
    cta: "Design your tag",
    image: "/store/key-tag-listing.webp",
    alt: "A black Data Plate key tag with raised amber lettering and rivets",
  },
  {
    id: "chibi-figure",
    title: "Chibi Figure",
    description:
      "A small stylised figure of a person, generated with Meshy AI and printed at Zenki Lab. You approve the 3D model before anything is printed.",
    bullets: ["About 10 cm or 20 cm", "Approve the model first", "50% deposit to start"],
    href: "/store/chibi-figure",
    cta: "View the figure",
    image: "/store/chibi-figure-listing.webp",
    alt: "A white 3D printed chibi figure of a man with glasses on a round base",
    focus: "center 40%",
  },
];
