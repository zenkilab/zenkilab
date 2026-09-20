"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { services } from "@/lib/constants";
import { StageIndex } from "@/components/ui/stage-index";
import { ScrollFade } from "@/components/ui/scroll-fade";

/** Stage photos (4:3, subject-centred) and their subject cut-outs sit in /services/stage */
const stageAsset = (image: string, kind: "bg" | "cut") =>
  `/services/stage/${image.replace("/services/", "").replace(".jpg", "")}-${kind}.webp`;

const items = services.map((service) => ({
  id: service.title,
  title: service.title,
  description: service.description,
  bullets: service.examples,
  href: service.href,
  cta: "Start a Project",
  bg: stageAsset(service.image, "bg"),
  cut: stageAsset(service.image, "cut"),
  alt: service.title,
}));

// Scroll distance given to each service while the scene is pinned
const VH_PER_ITEM = 55;
const NAV = 72; // fixed header height

/**
 * Pinned on desktop: the whole scene stays on screen while you scroll through it, and scroll
 * position picks the service (the same position always shows the same service). Clicking a
 * title or using the arrow keys scrolls to that service's stretch, so scroll and selection
 * never disagree. On touch devices and with reduced motion nothing is pinned.
 */
function ServicesStage() {
  const reduce = useReducedMotion();
  const [desktop, setDesktop] = useState(false);
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const n = items.length;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setDesktop(mq.matches);
    const on = () => setDesktop(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.max(0, Math.min(n - 1, Math.floor(v * n)))));

  if (!desktop || reduce) return <StageIndex items={items} />;

  const jump = (i: number) => {
    const el = track.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + range * ((i + 0.5) / n), behavior: "smooth" });
  };

  return (
    <div ref={track} style={{ height: `${n * VH_PER_ITEM + 100}vh` }}>
      <div className="sticky flex items-center" style={{ top: NAV, height: `calc(100dvh - ${NAV}px)` }}>
        <div className="w-full">
          <StageIndex items={items} activeIndex={active} onSelect={jump} />
        </div>
      </div>
    </div>
  );
}

export function ServicesSection() {
  return (
    <section id="services" className="relative py-24 lg:py-28 bg-background border-t" style={{ borderColor: "var(--color-border)" }}>
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        {/* Header */}
        <ScrollFade className="mb-14 lg:mb-16">
          <span className="text-xs font-semibold tracking-[0.15em] uppercase mb-4 block" style={{ color: "var(--color-accent-primary)" }}>
            What We Print
          </span>
          <h2
            className="text-[clamp(2rem,4.5vw,3rem)] font-bold tracking-[-0.02em] leading-[1.1] max-w-[700px]"
            style={{ color: "var(--color-text-primary)" }}
          >
            We print custom parts.
          </h2>
          <p className="text-lg mt-4 max-w-[600px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            From automotive components to household items and custom gifts. If
            you have a 3D model, we can manufacture it.
          </p>
        </ScrollFade>

        <ServicesStage />
      </div>
    </section>
  );
}