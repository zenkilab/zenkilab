import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoreExperience } from "@/components/store/store-experience";
import { storeItems } from "@/lib/store";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Store | Zenki Lab",
  description: "Custom key tags and chibi figures, 3D printed to order. Design yours and see it before you buy.",
  path: "/store",
});

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
