import type { Metadata } from "next";
import { storeItems } from "@/lib/store";

const item = storeItems.find((i) => i.id === "chibi-figure")!;

export const metadata: Metadata = {
  title: `${item.title} | Zenki Lab`,
  description: item.description,
  alternates: { canonical: "https://zenkilab.com/store/chibi-figure" },
  openGraph: { title: `${item.title} | Zenki Lab`, description: item.description, url: "https://zenkilab.com/store/chibi-figure" },
  twitter: { card: "summary_large_image", title: `${item.title} | Zenki Lab`, description: item.description },
};

export default function ChibiFigureLayout({ children }: { children: React.ReactNode }) {
  return children;
}
