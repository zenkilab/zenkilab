import type { Metadata } from "next";
import { dogTagItem } from "@/lib/store";
import { pageMetadata, productJsonLd } from "@/lib/seo";

// Internal/direct-link only for now (not in storeItems, so it's off the public Store catalog):
// noindex so it doesn't get picked up and surfaced before it's confirmed ready to list.
export const metadata: Metadata = {
  ...pageMetadata({
    title: `${dogTagItem.title} | Zenki Lab`,
    description: dogTagItem.description,
    path: "/store/dog-tag",
  }),
  robots: { index: false, follow: false },
};

const ld = productJsonLd({
  name: dogTagItem.title,
  description: dogTagItem.description,
  image: "/store/dog-tag-listing.webp",
  path: "/store/dog-tag",
});

export default function DogTagLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      {children}
    </>
  );
}
