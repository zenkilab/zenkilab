import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { HeroSection } from "@/components/sections/hero-section";
import { ServicesSection } from "@/components/sections/services-section";
import { pageMetadata } from "@/lib/seo";

// Review page for the Hairline gearbox hero, with the real hero copy and the section that follows it.
export const metadata: Metadata = {
  ...pageMetadata({
    title: "Hero preview | Zenki Lab",
    description: "Internal preview of the Hairline gearbox hero animation.",
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
        <ServicesSection />
      </main>
    </>
  );
}
