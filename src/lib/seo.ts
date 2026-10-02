import type { Metadata } from "next";

import { existsSync } from "node:fs";
import { join } from "node:path";
import { contactChannels, faqs } from "@/lib/constants";

export const SITE_URL = "https://zenkilab.com";
const DEFAULT_OG_IMAGE = "/opengraph-image.png";
const OG_EXTS = ["png", "jpg", "webp"];

/** Next.js doesn't deep-merge `openGraph`/`twitter` across route segments, so every page must declare
 * the full set. Drop an `opengraph-image.{png,jpg,webp}` next to a page and it is picked up here
 * with no other edit; pages without one fall back to the site image. */
function ogImageFor(path: string) {
  for (const ext of OG_EXTS) {
    const file = `opengraph-image.${ext}`;
    if (existsSync(join(process.cwd(), "src/app", path, file))) return `${path}/${file}`;
  }
  return DEFAULT_OG_IMAGE;
}

/** The one way to set a page's metadata: new pages call this with title, description and path. */
export function pageMetadata({
  title,
  description,
  path,
  image = ogImageFor(path),
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const url = `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: [image], siteName: "Zenki Lab", locale: "en_US", type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

const sameAs = contactChannels.filter((c) => c.href.startsWith("https://") && !c.href.includes("wa.me")).map((c) => c.href);

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Zenki Lab",
    url: SITE_URL,
    description: "Custom 3D printing workshop based in Sri Lanka: parts, prototypes, key tags and chibi figures.",
    logo: `${SITE_URL}/favicon-192.png`,
    areaServed: "LK",
    sameAs,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "quote@zenkilab.com",
      telephone: "+94702100270",
      availableLanguage: "English",
    },
  };
}

/** Tells Google the site's name, so a "Zenki Lab" search can resolve to zenkilab.com. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Zenki Lab",
    alternateName: ["ZenkiLab", "Zenki Lab Sri Lanka"],
    url: SITE_URL,
  };
}

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function breadcrumbJsonLd(crumbs: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path}`,
    })),
  };
}

/** No `offers` when the product has no fixed price (e.g. the key tag, priced only inside its customizer) —
 * Google's structured data guidelines require markup to match visible page content. */
export function productJsonLd({
  name,
  description,
  image,
  path,
  offer,
}: {
  name: string;
  description: string;
  image: string;
  path: string;
  offer?: { lowPrice: number; priceCurrency: string };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: `${SITE_URL}${image}`,
    url: `${SITE_URL}${path}`,
    brand: { "@type": "Brand", name: "Zenki Lab" },
    ...(offer && {
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: offer.priceCurrency,
        lowPrice: offer.lowPrice,
        availability: "https://schema.org/PreOrder",
        url: `${SITE_URL}${path}`,
      },
    }),
  };
}
