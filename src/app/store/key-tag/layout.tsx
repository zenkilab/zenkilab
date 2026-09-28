import type { Metadata } from "next";
import { storeItems } from "@/lib/store";

const item = storeItems.find((i) => i.id === "key-tag")!;

export const metadata: Metadata = {
  title: `${item.title} | Zenki Lab`,
  description: item.description,
  alternates: { canonical: "https://zenkilab.com/store/key-tag" },
  openGraph: { title: `${item.title} | Zenki Lab`, description: item.description, url: "https://zenkilab.com/store/key-tag" },
  twitter: { card: "summary_large_image", title: `${item.title} | Zenki Lab`, description: item.description },
};

export default function KeyTagLayout({ children }: { children: React.ReactNode }) {
  return children;
}
