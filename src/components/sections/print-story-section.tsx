"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { steps } from "@/lib/constants";
import { HairlineFigure } from "@/components/hero-hairline/HairlineFigure";
import { STEP_STILLS, STORY_SCENE } from "@/components/hero-hairline/story";
import type { Drive } from "@/components/hero-hairline/render";

const fillDown = "linear-gradient(to bottom, var(--color-accent-primary-light), var(--color-accent-primary))";
const LABEL =
  "Line drawing of how an order is made: a customer's 3D file and photo arrive, the part is sliced and measured for the quote, printed layer by layer, checked with calipers and packed, and Zenki Lab's own products appear beside it.";

// one still per step, drawn once: the stacked version's pictures
const STILLS = STEP_STILLS.map((p) => STORY_SCENE.frame(p, { az: 0, k: 0, lift: 0 }));

const storeLink = (
  <Link href="/store" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--color-accent-primary)" }}>
    And from our own store <ArrowRight className="h-4 w-4" aria-hidden="true" />
  </Link>
);

/**
 * "How it works" as a pinned scroll story: while the section scrolls by, the
 * drawing on the right follows the scroll through the four steps and the step
 * on the left lights up. Under reduced motion, or without JavaScript, the CSS
 * in globals.css swaps in a plain stacked version with one still per step.
 */
export function PrintStorySection() {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => setStep(Math.min(steps.length - 1, Math.floor(v * steps.length))));
  const drive = (): Drive => ({ mode: "scrub", target: () => scrollYProgress.get() });

  return (
    <section id="how-it-works" className="relative border-t" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)" }}>
      <noscript>
        <style>{".ps-pin{display:none!important}.ps-stack{display:block!important}"}</style>
      </noscript>

      {/* pinned: the figure stays while the section scrolls under it */}
      <div ref={ref} className="ps-pin relative">
        <div className="sticky top-0 flex h-[100dvh] items-center overflow-hidden">
          <div className="mx-auto grid w-full max-w-[1280px] items-center gap-4 px-6 pt-16 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:pt-12">
            <div className="order-2 lg:order-1 lg:col-span-5">
              <h2 className="mb-5 text-[clamp(1.5rem,4.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em] lg:mb-10" style={{ color: "var(--color-text-primary)" }}>
                From idea to finished part
              </h2>
              <div className="relative">
                <div className="absolute bottom-2 left-[7px] top-2 hidden w-px lg:block" style={{ backgroundColor: "var(--color-border)" }}>
                  <motion.div className="h-full w-full origin-top" style={{ scaleY: scrollYProgress, background: fillDown }} />
                </div>
                <ol className="lg:space-y-7">
                  {steps.map((s, i) => (
                    <li
                      key={s.title}
                      aria-current={i === step ? "step" : undefined}
                      className={`relative lg:pl-10 transition-opacity duration-300 ${i === step ? "block opacity-100" : "hidden opacity-35 lg:block"}`}
                    >
                      <span
                        className="absolute left-0 top-1 hidden h-[15px] w-[15px] rounded-full lg:block"
                        style={{ backgroundColor: "var(--color-bg-surface)", border: `2px solid ${i <= step ? "var(--color-accent-primary)" : "var(--color-border-light)"}` }}
                        aria-hidden="true"
                      />
                      <p className="mb-1 font-mono text-xs tracking-[0.14em]" style={{ color: "var(--color-accent-primary)" }}>
                        {s.number} / {String(steps.length).padStart(2, "0")}
                      </p>
                      <h3 className="mb-1.5 text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{s.title}</h3>
                      <p className="max-w-[40ch] text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{s.description}</p>
                      {i === steps.length - 1 && storeLink}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <HairlineFigure
              scene={STORY_SCENE}
              drive={drive}
              label={LABEL}
              className="order-1 mx-auto w-full max-w-[min(100%,52dvh)] lg:order-2 lg:col-span-7 lg:max-w-none"
            />
          </div>
        </div>
      </div>

      {/* stacked: reduced motion and no JavaScript */}
      <div className="ps-stack mx-auto max-w-[1280px] px-6 py-24 lg:px-8">
        <h2 className="mb-12 text-[clamp(2rem,4.5vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em]" style={{ color: "var(--color-text-primary)" }}>
          From idea to finished part
        </h2>
        <ol className="grid gap-12 sm:grid-cols-2">
          {steps.map((s, i) => (
            <li key={s.title}>
              <div role="img" aria-label={`${s.title}: ${LABEL}`} className="hl-fig relative mb-4 aspect-[5/4] w-full">
                <svg viewBox="0 0 400 320" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
                  {STILLS[i].map((it, j) => (
                    <path key={j} d={it.d} className={it.c} opacity={it.o} />
                  ))}
                </svg>
              </div>
              <h3 className="mb-1.5 text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{s.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{s.description}</p>
              {i === steps.length - 1 && storeLink}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
