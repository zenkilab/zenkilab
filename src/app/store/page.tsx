import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoreExperience } from "@/components/store/store-experience";
import { storeItems } from "@/lib/store";

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
