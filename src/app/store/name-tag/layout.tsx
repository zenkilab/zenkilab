import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// Customer review page, direct link only: kept out of search and off the Store catalog.
export const metadata: Metadata = {
  ...pageMetadata({
    title: "Name Tag | Zenki Lab",
    description: "Design a light pin-on name tag with your logo, name and role.",
    path: "/store/name-tag",
  }),
  robots: { index: false, follow: false },
};

export default function NameTagLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
