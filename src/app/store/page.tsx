import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CrossfadeShowcase } from "@/components/ui/crossfade-showcase";
import { storeItems } from "@/lib/store";

export default function StorePage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1280px] px-6 pb-24 pt-28 lg:px-8">
        <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em]">Store</h1>
        <p className="mt-4 max-w-[52ch] text-lg leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Two things you can order today, made to order in Kaduwela, Sri Lanka.
        </p>
        <div className="mt-14 lg:mt-16">
          <CrossfadeShowcase items={storeItems} aspect="4 / 5" />
        </div>
      </main>
      <Footer />
    </>
  );
}
