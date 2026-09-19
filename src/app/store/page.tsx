import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoreGrid } from "@/components/store/store-grid";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { storeItems } from "@/lib/store";

export default function StorePage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1280px] px-6 pb-28 pt-32 lg:px-8 lg:pt-40">
        <ScrollFade>
          <h1 className="text-[clamp(2.75rem,7vw,5.5rem)] font-bold leading-[1] tracking-[-0.03em]">Store</h1>
          <p className="mt-6 max-w-[44ch] text-lg leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            Two things you can order today, made to order in Kaduwela, Sri Lanka.
          </p>
        </ScrollFade>
        <div className="mt-20 lg:mt-28">
          <StoreGrid items={storeItems} />
        </div>
      </main>
      <Footer />
    </>
  );
}
