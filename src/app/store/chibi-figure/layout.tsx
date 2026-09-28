import type { Metadata } from "next";
import { CHIBI_SIZES, storeItems } from "@/lib/store";
import { pageMetadata, productJsonLd } from "@/lib/seo";

const item = storeItems.find((i) => i.id === "chibi-figure")!;

export const metadata: Metadata = pageMetadata({
  title: `${item.title} | Zenki Lab`,
  description: item.description,
  path: "/store/chibi-figure",
  image: "/store/chibi-figure/opengraph-image.png",
});

const ld = productJsonLd({
  name: item.title,
  description: item.description,
  image: "/store/chibi-1.webp",
  path: "/store/chibi-figure",
  offer: { lowPrice: CHIBI_SIZES[0].price!, priceCurrency: "LKR" },
});

export default function ChibiFigureLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      {children}
    </>
  );
}
