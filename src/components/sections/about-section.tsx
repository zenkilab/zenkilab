"use client";

import { motion } from "framer-motion";
import { aboutText, trustStats } from "@/lib/constants";

export function AboutSection() {
  return (
    <section id="about" className="relative py-24 lg:py-28 bg-background border-t" style={{ borderColor: "var(--color-border)" }}>
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <span className="text-xs font-semibold tracking-[0.15em] uppercase mb-4 block" style={{ color: "var(--color-accent-primary)" }}>
              About the Workshop
            </span>
            <h2 className="text-[clamp(2rem,4.5vw,3rem)] font-bold tracking-[-0.02em] leading-[1.1] mb-6" style={{ color: "var(--color-text-primary)" }}>
              {aboutText.heading}
            </h2>
            <p className="text-lg leading-relaxed mb-6" style={{ color: "var(--color-text-secondary)" }}>
              {aboutText.paragraph1}
            </p>
            <p className="leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              {aboutText.paragraph2}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            className="grid grid-cols-2 gap-4"
          >
            {trustStats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: 0.2 + idx * 0.08, ease: "easeOut" }}
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}