import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { HeroSection } from "@/components/sections/hero-section";
import { ServicesSection } from "@/components/sections/services-section";
import { PrintStorySection } from "@/components/sections/print-story-section";
import { pageMetadata } from "@/lib/seo";

// Review page for the Hairline hero and the scroll story, with the real copy and the section that follows them.
export const metadata: Metadata = {
  ...pageMetadata({
    title: "Hero preview | Zenki Lab",
    description: "Internal preview of the Hairline hero and the How it works scroll story.",
    path: "/preview/hero-hairline",
  }),
  robots: { index: false, follow: false },
};

export default function HeroHairlinePreview() {
  return (
    <>
      <Header />
      <main>
        <HeroSection variant="hairline" />
        <PrintStorySection />
        <ServicesSection />
      </main>
    </>
  );
}
