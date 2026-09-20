"use client";

import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Background } from "./Background";
import { HeroText } from "./HeroText";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const Scene = lazy(() => import("./Scene").then((m) => ({ default: m.Scene })));

function SceneFallback() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="w-40 h-40 rounded-full border border-primary/30 animate-pulse" />
    </div>
  );
}

export function Hero({ onStart }: { onStart: () => void }) {
  // Mount the desktop canvas only on desktop, so mobile does not pay for a hidden third Canvas.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => setIsDesktop(window.matchMedia("(min-width: 1024px)").matches), []);

  return (
    <>
      <Background />

      {/* Desktop: full-screen 3D canvas behind text */}
      <div className="hidden lg:block absolute inset-0 z-0">
        {isDesktop && (
          <Suspense fallback={<SceneFallback />}>
            <Scene />
          </Suspense>
        )}
      </div>

      <div className="relative z-10 max-w-[1280px] w-full mx-auto px-6 lg:px-8">
        {/* Desktop: side-by-side grid */}
        <div className="hidden lg:grid grid-cols-12 gap-8 items-center">
          <div className="col-span-5">
            <HeroText onStart={onStart} />
          </div>
          <div className="col-span-7" />
        </div>

        {/* Mobile: stacked column */}
        <div className="lg:hidden mt-[10vh]">
          <HeroText onStart={onStart} />

          {/* Phone + Hologram + Particles — behind text layer, click-through */}
          <MobilePhoneScene />

          {/* Printer — overlaps 40% of phone canvas */}
          <MobilePrinterScene />
        </div>
      </div>
    </>
  );
}

function MobilePhoneScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    const mm = window.matchMedia("(max-width: 767px)");
    if (!mm.matches) return;

    gsap.set(el, { opacity: 0, y: 40 });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      end: "bottom 40%",
      scrub: 0.8,
      onUpdate: (self) => {
        gsap.set(el, { opacity: 1, y: 40 * (1 - self.progress) });
        setScrollProgress(self.progress);
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[70vh] rounded-2xl -mt-[10vh] mb-0 pointer-events-none overflow-hidden z-0"
      style={{ opacity: 0 }}
    >
      <Suspense fallback={<SceneFallback />}>
        <Scene renderOnly="phone-hologram" mobileScrollProgress={scrollProgress} />
      </Suspense>
    </div>
  );
}

function MobilePrinterScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (typeof window === "undefined") return;
    const mm = window.matchMedia("(max-width: 767px)");
    if (!mm.matches) return;

    gsap.set(el, { opacity: 0, y: 40 });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      end: "bottom 40%",
      scrub: 0.8,
      onUpdate: (self) => {
        gsap.set(el, { opacity: 1, y: 40 * (1 - self.progress) });
        setScrollProgress(self.progress);
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[85vh] rounded-2xl overflow-hidden -mt-[28vh] mb-8 z-20 pointer-events-none"
      style={{ opacity: 0 }}
    >
      <Suspense fallback={<SceneFallback />}>
        <Scene renderOnly="printer" mobileScrollProgress={scrollProgress} />
      </Suspense>
    </div>
  );
}