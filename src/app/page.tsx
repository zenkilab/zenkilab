import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/sections/hero-section";
import { ServicesSection } from "@/components/sections/services-section";
import { HowItWorksSection } from "@/components/sections/how-it-works-section";
import { MaterialsSection } from "@/components/sections/materials-section";
import { AboutSection } from "@/components/sections/about-section";
import { FAQSection } from "@/components/sections/faq-section";
import { QuoteSection } from "@/components/sections/quote-section";
import { ContactSection } from "@/components/sections/contact-section";
import { faqJsonLd } from "@/lib/seo";

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }} />
      <Header />
      <main>
        <HeroSection />
        <ServicesSection />
        <HowItWorksSection />
        <MaterialsSection />
        <AboutSection />
        <FAQSection />
        <QuoteSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
