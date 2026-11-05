"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { steps } from "@/lib/constants";
import { Background } from "@/components/hero3d/Background";
import { HeroText } from "@/components/hero3d/HeroText";
import { clamp } from "./hairline";
import { STEP_STILLS, STILL_T, caption, frame, still } from "./journey";
import { mount } from "./render";

const REST = { az: 0, k: 0, lift: 0, dx: 0 };
// drawn once: the server's picture (also the one without JavaScript and under reduced motion), and one still per step
const POSTER = frame(STILL_T, REST, { x: 0, p: 0 });
const STILLS = STEP_STILLS.map(still);
const LABEL =
  "Line drawing of Zenki Lab's workshop: a print queue of customer files and store products. Scrolling on, a customer's request (a 3D file, a photo and a note) is reviewed and quoted, then printed, checked, packed, and joined by Zenki Lab's own products.";

function Paths({ items }: { items: typeof POSTER }) {
  return items.map((it, i) => <path key={i} d={it.d} className={it.c} opacity={it.o} />);
}

/**
 * The hero and "From idea to finished part" as one scene: one drawing stays
 * on screen (sticky) while the hero copy, then the four steps, scroll past.
 * Scroll hands the drawing from the print queue to the story and then
 * advances the story; see journey.ts and render.ts.
 */
export function HairlineJourney({ onStart }: { onStart: () => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const capRef = useRef<HTMLParagraphElement>(null);
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
    return mount(svg, scroll, list.closest("section") ?? svg.parentElement!, capRef.current);
  }, []);

  return (
    <>
      {/* the hero's backdrop covers only the first screen, fading into the page */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[100dvh]">
        <Background />
        <div className="absolute inset-x-0 bottom-0 h-40" style={{ background: "linear-gradient(to bottom, transparent, var(--color-bg-primary))" }} />
      </div>

      <noscript>
        <style>{".jr-fig{position:static!important}.jr-still{display:block!important}"}</style>
      </noscript>

      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col px-6 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:px-8">
        <div className="pb-8 pt-28 lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:flex lg:min-h-[100dvh] lg:items-center lg:py-0">
          <HeroText onStart={onStart} />
        </div>

        {/* the one drawing: under the CTAs on phones, then pinned below the header; pinned in the right column on desktop */}
        <div ref={figRef} className="jr-fig sticky top-[72px] z-10 -mx-6 px-6 pb-2 lg:top-0 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:flex lg:h-[100dvh] lg:flex-col lg:justify-center lg:self-start lg:px-0 lg:pb-0">
          <div role="img" aria-label={LABEL} className="hl-fig relative mx-auto aspect-[5/4] w-full max-w-[min(100%,46dvh)] lg:max-w-none">
            <svg ref={svgRef} viewBox="0 0 400 320" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
              <Paths items={POSTER} />
            </svg>
          </div>
          {/* a live read-out, changing many times a second: decorative for screen readers, the label says it all */}
          <p ref={capRef} aria-hidden="true" className="hl-cap">{caption(STILL_T, { x: 0, p: 0 })}</p>
        </div>

        <div id="how-it-works" className="scroll-mt-24 lg:col-span-5 lg:col-start-1 lg:row-start-2">
          <h2 className="pt-16 text-[clamp(1.75rem,4.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em] lg:pt-0" style={{ color: "var(--color-text-primary)" }}>
            From idea to finished part
          </h2>
          <ol ref={stepsRef}>
            {steps.map((s, i) => (
              <li key={s.title} className="flex min-h-[70dvh] flex-col justify-center py-10 lg:min-h-[85dvh]">
                <div role="img" aria-label={`${s.title}, as a line drawing`} className="jr-still hl-fig relative mb-6 hidden aspect-[5/4] w-full">
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
