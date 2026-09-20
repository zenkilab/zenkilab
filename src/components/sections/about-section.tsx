"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { aboutText } from "@/lib/constants";

// Depth panel: the photo drifts slower than the page and settles as it arrives, the
// heading moves at its own rate, and the story fades in behind it. Scroll-linked, so it
// follows the visitor in both directions. Static under reduced motion.
export function AboutSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const frameOpacity = useTransform(p, [0, 0.22, 0.85, 1], [0.15, 1, 1, 0.3]);
  const imgY = useTransform(p, [0, 1], ["-9%", "9%"]);
  const imgScale = useTransform(p, [0, 0.5], [1.14, 1.03]);
  const headingY = useTransform(p, [0, 1], [80, -80]);
  const textOpacity = useTransform(p, [0.18, 0.42, 0.85, 1], [0, 1, 1, 0.4]);
  const textY = useTransform(p, [0.18, 0.42], [48, 0]);

  return (
    <section id="about" className="relative py-24 lg:py-32 border-t overflow-hidden" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)" }}>
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div ref={ref} className="relative">
          <motion.div
            className="relative overflow-hidden rounded-2xl"
            style={{
              height: "min(66vh, 620px)",
              backgroundColor: "var(--color-bg-primary)",
              border: "1px solid var(--color-border)",
              opacity: reduce ? 1 : frameOpacity,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
              src="/services/automotive.jpg"
              alt="Two black 3D printed intake trumpets made at Zenki Lab"
              loading="lazy"
              decoding="async"
              className="absolute left-0 top-[-12%] h-[124%] w-full object-cover object-[50%_55%]"
              style={reduce ? undefined : { y: imgY, scale: imgScale }}
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: "linear-gradient(to top, var(--color-bg-surface), transparent)" }} />
          </motion.div>

          <div className="relative -mt-16 px-2 sm:px-8 lg:-mt-24">
            <motion.h2
              style={reduce ? { color: "var(--color-text-primary)" } : { y: headingY, color: "var(--color-text-primary)" }}
              className="text-[clamp(2.5rem,6.5vw,5.5rem)] font-bold leading-[1] tracking-[-0.03em] max-w-[14ch]"
            >
              {aboutText.heading}
            </motion.h2>

            <motion.div
              style={reduce ? undefined : { opacity: textOpacity, y: textY }}
              className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-2 lg:gap-16"
            >
              <p className="text-lg leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {aboutText.paragraph1}
              </p>
              <p className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {aboutText.paragraph2}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
