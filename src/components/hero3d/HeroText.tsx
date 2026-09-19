"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Zap, Sparkles } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * HeroText
 * ─────────────────────────────────────────────────────────
 * Left-column headline / copy / CTAs. On scroll, the whole
 * block fades upward and out slightly (GSAP ScrollTrigger,
 * scrubbed), giving the hero a sense of depth as the 3D scene
 * behind it rotates and scales.
 */
export function HeroText({ onStart }: { onStart: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const el = rootRef.current;

    const trigger = ScrollTrigger.create({
      trigger: "#home",
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        gsap.set(el, {
          y: -self.progress * 60,
          opacity: 1 - self.progress * 0.9,
        });
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <div ref={rootRef} className="lg:col-span-5 text-center lg:text-left">
      <span
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.14em] uppercase mb-6"
        style={{ color: "var(--color-accent-primary)", backgroundColor: "var(--color-accent-glow)", border: "1px solid var(--color-accent-border)" }}
      >
        <Sparkles className="w-3 h-3" />
        Precision Additive Manufacturing
      </span>

      <h1 className="text-[clamp(2.1rem,4vw,3.1rem)] font-extrabold leading-[1.12] tracking-[-0.01em] mb-6 text-white uppercase">
        Built by makers,
        <br />
        <span style={{ color: "var(--color-accent-primary)" }}>for makers.</span>
      </h1>

      <p className="text-base lg:text-lg leading-relaxed mb-9 max-w-[480px] mx-auto lg:mx-0 text-[color:var(--color-text-secondary)]">
        Professional custom 3D printing for makers, enthusiasts and businesses. We manufacture custom parts, prototypes and one-off projects from your 3D models.
      </p>

      <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex items-center justify-center gap-2 h-[52px] px-8 rounded-xl text-base font-semibold transition-colors duration-200 hover:bg-[color:var(--color-accent-primary-light)] w-full sm:w-auto"
          style={{ backgroundColor: "var(--color-accent-primary)", color: "var(--color-bg-primary)" }}
        >
          <Zap className="w-4.5 h-4.5" aria-hidden="true" />
          Start a Project
        </button>
        <Link
          href="/store"
          className="inline-flex items-center justify-center gap-2 h-[52px] px-8 rounded-xl text-base font-semibold border transition-colors duration-200 w-full sm:w-auto text-white/90 hover:bg-white/5"
          style={{ borderColor: "rgba(255,255,255,0.18)" }}
        >
          Go to Store
        </Link>
      </div>
    </div>
  );
}