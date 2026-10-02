import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

// Customer review page, direct link only: kept out of search and off the Store catalog.
export const metadata: Metadata = {
  ...pageMetadata({
    title: "AyuVeda Staff Badges | Zenki Lab",
    description: "Review the design for the AyuVeda Wellness & Rehabilitation staff badges.",
    path: "/store/ayuveda-badge",
  }),
  robots: { index: false, follow: false },
};

export default function AyuvedaBadgeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
