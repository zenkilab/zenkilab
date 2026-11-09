"use client";

import { useEffect, useRef, type Ref } from "react";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";
import { steps } from "@/lib/constants";
import { clamp } from "./hairline";
import { STEP_STILLS, STILL_T, frame, heroCaption, still, storyCaption } from "./journey";
import { mount } from "./render";
import { BACK_BOX, back, front } from "./workshop";

const REST = { az: 0, k: 0, lift: 0, dx: 0 };
// drawn once: the server's picture (also the one without JavaScript and under reduced motion), one still per step, and the planes either side
const POSTER = frame(STILL_T, REST, { x: 0, p: 0 });
const STILLS = STEP_STILLS.map(still);
const BACK = back();
const FRONT = front();
const LABEL =
  "Drawing of Zenki Lab's workshop: a print queue of customer files and store products, filament spools and tools behind. Scrolling on, a customer's request (a 3D file, a photo and a note) is reviewed and quoted, then printed, checked, packed, and joined by Zenki Lab's own products.";

function Paths({ items }: { items: typeof POSTER }) {
  return items.map((it, i) => <path key={i} d={it.d} className={it.c} opacity={it.o} />);
}

/** The hero copy. The headline prints in layers (CSS only); the read-out under it is the print queue's, live. */
function HeroCopy({ onStart, capRef }: { onStart: () => void; capRef: Ref<HTMLParagraphElement> }) {
  return (
    <div className="text-center lg:text-left">
      <span
        className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: "var(--color-accent-primary)", backgroundColor: "var(--color-accent-glow)", border: "1px solid var(--color-accent-border)" }}
      >
        Precision Additive Manufacturing
      </span>
      <h1 className="hl-h1 mb-5 text-[clamp(2.3rem,5vw,4rem)] font-bold uppercase leading-[1.04] tracking-[-0.015em] text-white">
        <span className="pl">Built by makers,</span>
        <span className="pl pl-2" style={{ color: "var(--color-accent-primary)" }}>for makers.</span>
      </h1>
      {/* changes many times a second: decorative for screen readers */}
      <p ref={capRef} aria-hidden="true" className="hl-read">{heroCaption(STILL_T)}</p>
      <p className="mx-auto mb-9 max-w-[480px] text-base leading-relaxed lg:mx-0 lg:text-lg" style={{ color: "var(--color-text-secondary)" }}>
        Professional custom 3D printing for makers, enthusiasts and businesses. We manufacture custom parts, prototypes and one-off projects from your 3D models.
      </p>
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:items-start lg:justify-start">
        <button
          type="button"
          onClick={onStart}
          className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl px-8 text-base font-semibold transition-colors duration-200 hover:bg-[color:var(--color-accent-primary-light)] sm:w-auto"
          style={{ backgroundColor: "var(--color-accent-primary)", color: "var(--color-bg-primary)" }}
        >
          <Zap className="h-4.5 w-4.5" aria-hidden="true" />
          Start a Project
        </button>
        <Link
          href="/store"
          className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border px-8 text-base font-semibold text-white/90 transition-colors duration-200 hover:bg-white/5 sm:w-auto"
          style={{ borderColor: "rgba(255,255,255,0.18)" }}
        >
          Go to Store
        </Link>
      </div>
    </div>
  );
}

/**
 * The hero and "From idea to finished part" as one scene: one drawing stays
 * on screen (sticky) while the hero copy, then the four steps, scroll past.
 * The headline sits in the scene: on desktop the drawing runs in behind it.
 * Depth comes from three planes: the workshop behind (blurred, static),
 * the drawing, and parts floating in front (static); only the drawing
 * redraws. Scroll hands the drawing from the print queue to the story and
 * then advances the story; see journey.ts and render.ts.
 */
export function HairlineJourney({ onStart }: { onStart: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const heroCapRef = useRef<HTMLParagraphElement>(null);
  const storyCapRef = useRef<HTMLParagraphElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const figRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svg = svgRef.current, list = stepsRef.current;
    if (!svg || !list) return;
    // x: the hand-off, done as the first step reaches mid-screen; p: the story, step i centred at (i + 0.5) / 4
    const scroll = () => {
      const r = list.getBoundingClientRect(), vh = innerHeight, x = clamp((vh - r.top) / (vh / 2), 0, 1);
      // phones: the pinned drawing gets an opaque backing once the steps start passing under it
      figRef.current?.classList.toggle("jr-stuck", x > 0.01);
      return { x, p: clamp((vh / 2 - r.top) / r.height, 0, 1) };
    };
    return mount(svg, scroll, list.closest("section") ?? svg.parentElement!, {
      heroCap: heroCapRef.current, storyCap: storyCapRef.current, back: backRef.current, front: frontRef.current,
    });
  }, []);

  return (
    <>
      <div aria-hidden="true" className="jr-atmo pointer-events-none absolute inset-x-0 top-0 h-[100dvh]" />

      <noscript>
        <style>{".jr-fig{position:static!important}.jr-still{display:block!important}.hl-cap{opacity:0!important}"}</style>
      </noscript>

      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col px-6 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:px-8">
        <div className="jr-copy relative z-20 pb-6 pt-28 lg:col-span-6 lg:col-start-1 lg:row-start-1 lg:flex lg:min-h-[100dvh] lg:items-center lg:py-0">
          <HeroCopy onStart={onStart} capRef={heroCapRef} />
        </div>

        {/* the one drawing: under the CTAs on phones, then pinned below the header; pinned on the right on desktop, running in behind the headline */}
        <div ref={figRef} className="jr-fig sticky top-[72px] z-10 -mx-6 px-6 pb-2 lg:top-0 lg:col-span-8 lg:col-start-5 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:flex lg:h-[100dvh] lg:flex-col lg:justify-center lg:self-start lg:px-0 lg:pb-0">
          <div role="img" aria-label={LABEL} className="hl-fig relative mx-auto aspect-[5/4] w-full max-w-[min(100%,46dvh)] lg:max-w-[min(100%,calc((100dvh-7rem)*1.25))]">
            <div ref={backRef} aria-hidden="true" className="hl-back">
              <svg viewBox={BACK_BOX} className="h-full w-full"><Paths items={BACK} /></svg>
            </div>
            <svg ref={svgRef} viewBox="0 0 400 320" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
              <Paths items={POSTER} />
            </svg>
            <div ref={frontRef} aria-hidden="true" className="hl-front">
              <svg viewBox="0 0 400 320" className="h-full w-full overflow-visible"><Paths items={FRONT} /></svg>
            </div>
          </div>
          {/* the story's read-out, once the story starts (the print queue's is under the headline) */}
          <p ref={storyCapRef} aria-hidden="true" className="hl-cap" style={{ opacity: 0 }}>{storyCaption({ x: 0, p: 0 })}</p>
        </div>

        <div id="how-it-works" className="relative z-20 scroll-mt-24 lg:col-span-4 lg:col-start-1 lg:row-start-2">
          <h2 className="pt-16 text-[clamp(1.75rem,4.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em] lg:pt-0" style={{ color: "var(--color-text-primary)" }}>
            From idea to finished part
          </h2>
          <ol ref={stepsRef}>
            {steps.map((s, i) => (
              <li key={s.title} className="flex min-h-[70dvh] flex-col justify-center py-10 lg:min-h-[85dvh]">
                <div role="img" aria-label={`${s.title}, as a drawing`} className="jr-still hl-fig relative mb-6 hidden aspect-[5/4] w-full">
                  <svg viewBox="0 0 400 320" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
                    <Paths items={STILLS[i]} />
                  </svg>
                </div>
                <p className="mb-2 font-mono text-xs tracking-[0.14em]" style={{ color: "var(--color-accent-primary)" }}>
                  {s.number} / {String(steps.length).padStart(2, "0")}
                </p>
                <h3 className="mb-2 text-xl font-semibold lg:text-2xl" style={{ color: "var(--color-text-primary)" }}>{s.title}</h3>
                <p className="max-w-[42ch] text-base leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{s.description}</p>
                {i === steps.length - 1 && (
                  <Link href="/store" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--color-accent-primary)" }}>
                    And from our own store <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}
