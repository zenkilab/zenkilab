"use client";

import { motion } from "framer-motion";
import { aboutText, trustStats } from "@/lib/constants";

// Pinned-photo, scrolling-text (DESIGN_SYSTEM.md section 4): the photo sticks on
// desktop while the story scrolls past it. One photo, not a gallery.
export function AboutSection() {
  return (
    <section id="about" className="relative py-24 lg:py-28 bg-background border-t" style={{ borderColor: "var(--color-border)" }}>
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          {/* Pinned photo */}
          <div className="lg:sticky lg:top-28">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/services/automotive.jpg"
                alt="Two black 3D printed intake trumpets made at Zenki Lab"
                className="absolute inset-0 h-full w-full object-cover object-[35%_50%]"
              />
            </div>
          </div>

          {/* Scrolling story */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <span className="text-xs font-semibold tracking-[0.15em] uppercase mb-4 block" style={{ color: "var(--color-accent-primary)" }}>
                About the Workshop
              </span>
              <h2 className="text-[clamp(2rem,4.5vw,3rem)] font-bold tracking-[-0.02em] leading-[1.1]" style={{ color: "var(--color-text-primary)" }}>
                {aboutText.heading}
              </h2>
            </motion.div>

            {[aboutText.paragraph1, aboutText.paragraph2].map((p, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className={`leading-relaxed mt-8 lg:mt-0 lg:min-h-[55vh] lg:flex lg:items-center ${i === 0 ? "text-lg" : ""}`}
                style={{ color: "var(--color-text-secondary)" }}
              >
                {p}
              </motion.p>
            ))}

            <div className="grid grid-cols-2 gap-4 mt-12 lg:mt-4">
              {trustStats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: idx * 0.08, ease: "easeOut" }}
                  className="rounded-2xl p-6 lg:p-8 text-center transition-all duration-300 hover:shadow-md"
                  style={{ backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}
                >
                  <span className="text-[clamp(1.75rem,3vw,2.5rem)] font-bold tracking-[-0.02em] block mb-1" style={{ color: "var(--color-text-primary)" }}>
                    {stat.value}
                  </span>
                  <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {stat.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
