import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoreExperience } from "@/components/store/store-experience";
import { storeItems } from "@/lib/store";

const title = "Store | Zenki Lab";
const description = "Custom key tags and chibi figures, 3D printed to order. Design yours and see it before you buy.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://zenkilab.com/store" },
  openGraph: { title, description, url: "https://zenkilab.com/store" },
  twitter: { card: "summary_large_image", title, description },
};

export default function StorePage() {
  return (
    <>
      <Header />
      <main>
        <StoreExperience items={storeItems} />
      </main>
      <Footer />
    </>
  );
}
