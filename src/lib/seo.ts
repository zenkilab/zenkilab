import type { Metadata } from "next";

export const SITE_URL = "https://zenkilab.com";
// Next.js doesn't deep-merge `openGraph`/`twitter` across route segments: a page that
// declares its own loses the root's file-convention image unless it repeats it here.
const DEFAULT_OG_IMAGE = "/opengraph-image.png";

export function pageMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
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
    openGraph: { title, description, url, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Zenki Lab",
    url: SITE_URL,
    description: "Custom 3D printing workshop based in Sri Lanka: parts, prototypes, key tags and chibi figures.",
    areaServed: "LK",
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
