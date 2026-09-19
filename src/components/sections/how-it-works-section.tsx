"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll } from "framer-motion";
import { steps } from "@/lib/constants";

// The amber line draws as the section scrolls by, so the order of the four steps
// reads as a sequence. Gradient runs light to base.
const fill = "linear-gradient(to right, var(--color-accent-primary-light), var(--color-accent-primary))";
const fillDown = "linear-gradient(to bottom, var(--color-accent-primary-light), var(--color-accent-primary))";

export function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 65%"] });
  const progress = reduce ? 1 : scrollYProgress;

  return (
    <section id="how-it-works" className="relative py-24 lg:py-28 border-t" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)" }}>
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <h2 className="text-[clamp(2rem,4.5vw,3rem)] font-bold tracking-[-0.02em] leading-[1.1] mb-14 lg:mb-20" style={{ color: "var(--color-text-primary)" }}>
          From idea to finished part
        </h2>

        <div ref={ref} className="relative">
          {/* Desktop track */}
          <div className="absolute left-0 right-0 top-[7px] hidden h-px lg:block" style={{ backgroundColor: "var(--color-border)" }}>
            <motion.div className="h-full origin-left" style={{ scaleX: progress, background: fill }} />
          </div>
          {/* Mobile track */}
          <div className="absolute bottom-2 left-[7px] top-2 w-px lg:hidden" style={{ backgroundColor: "var(--color-border)" }}>
            <motion.div className="h-full w-full origin-top" style={{ scaleY: progress, background: fillDown }} />
          </div>

          <ol className="grid gap-12 lg:grid-cols-4 lg:gap-10">
            {steps.map((step) => (
              <li key={step.title} className="relative pl-10 lg:pl-0 lg:pt-12">
                <span
                  className="absolute left-0 top-0 h-[15px] w-[15px] rounded-full"
                  style={{ backgroundColor: "var(--color-bg-surface)", border: "2px solid var(--color-accent-primary)" }}
                  aria-hidden="true"
                />
                <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>{step.title}</h3>
                <p className="text-sm leading-relaxed max-w-[34ch]" style={{ color: "var(--color-text-secondary)" }}>{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
