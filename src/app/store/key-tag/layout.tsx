import type { Metadata } from "next";
import { storeItems } from "@/lib/store";
import { pageMetadata, productJsonLd } from "@/lib/seo";

const item = storeItems.find((i) => i.id === "key-tag")!;

export const metadata: Metadata = pageMetadata({
  title: `${item.title} | Zenki Lab`,
  description: item.description,
  path: "/store/key-tag",
  image: "/store/key-tag/opengraph-image.png",
});

const ld = productJsonLd({
  name: item.title,
  description: item.description,
  image: "/store/key-tag-listing.webp",
  path: "/store/key-tag",
});

export default function KeyTagLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      {children}
    </>
  );
}
